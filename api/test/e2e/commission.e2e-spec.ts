import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import {
	ApiKeyCredentials,
	apiKeyHeaders,
	createApiKeyCredentials,
} from '../support/auth';
import {
	createCommissionFunction,
	createLink,
	createProgram,
	createPromoter,
	uniqueEmail,
} from '../support/factories';
import {
	addCondition,
	createCircle,
	createSwitchCircleFunction,
	ListenerTracker,
	setFunctionStatus,
	trackEventListeners,
} from '../support/conversion-helpers';
import {
	Circle,
	CirclePromoter,
	Commission,
	Link,
	Program,
	Promoter,
} from '../../src/entities';
import {
	commissionTypeEnum,
	conditionOperatorEnum,
	conditionParameterEnum,
	conversionTypeEnum,
	functionStatusEnum,
	triggerEnum,
} from '../../src/enums';

/**
 * Commission generation. A signup or purchase emits an event that
 * FunctionTriggerService handles out of band: every active function of the
 * program whose trigger matches, whose circle holds the promoter and whose
 * conditions all pass is applied — commission-generating functions first,
 * then circle switches. The listener is awaited through the tracker, so each
 * assertion sees the finished side effects (or their definite absence).
 */
describe('commission generation (e2e)', () => {
	let app: INestApplication<App>;
	let dataSource: DataSource;
	let listeners: ListenerTracker;

	beforeAll(async () => {
		app = await createTestApp({ http: true });
		dataSource = app.get(DataSource);
		listeners = trackEventListeners(app);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	afterEach(async () => {
		await listeners?.settle();
	});

	interface Merchant {
		program: Program;
		defaultCircle: Circle;
		promoter: Promoter;
		link: Link;
		credentials: ApiKeyCredentials;
	}

	async function seedMerchant(): Promise<Merchant> {
		const { program, defaultCircle } = await createProgram(dataSource);
		const { promoter } = await createPromoter(
			dataSource,
			program,
			defaultCircle,
		);
		const link = await createLink(dataSource, program, promoter);
		const credentials = await createApiKeyCredentials(
			dataSource,
			program.programId,
		);
		return { program, defaultCircle, promoter, link, credentials };
	}

	async function signUp(m: Merchant, email = uniqueEmail('lead')) {
		const response = await request(app.getHttpServer())
			.post('/api/signups')
			.set(apiKeyHeaders(m.credentials))
			.send({ ref_val: m.link.refVal, email })
			.expect(201);
		await listeners.settle();
		return response.body.data as { contact_id: string };
	}

	async function purchase(
		m: Merchant,
		amount: number,
		options: { email?: string; itemId?: string } = {},
	) {
		const response = await request(app.getHttpServer())
			.post('/api/purchases')
			.set(apiKeyHeaders(m.credentials))
			.send({
				ref_val: m.link.refVal,
				email: options.email ?? uniqueEmail('buyer'),
				amount,
				item_id: options.itemId ?? 'item',
			})
			.expect(201);
		await listeners.settle();
		return response.body.data as {
			purchase_id: string;
			contact_id: string;
		};
	}

	const commissionsOf = (promoter: Promoter) =>
		dataSource.getRepository(Commission).find({
			where: { promoterId: promoter.promoterId },
			order: { createdAt: 'ASC' },
		});

	const fixedOnSignUp = (
		m: Merchant,
		value: number,
		circle: Circle = m.defaultCircle,
	) =>
		createCommissionFunction(dataSource, m.program, circle, {
			trigger: triggerEnum.SIGNUP,
			commissionType: commissionTypeEnum.FIXED,
			commissionValue: value,
		});

	const percentOnPurchase = (
		m: Merchant,
		value: number,
		circle: Circle = m.defaultCircle,
	) =>
		createCommissionFunction(dataSource, m.program, circle, {
			trigger: triggerEnum.PURCHASE,
			commissionType: commissionTypeEnum.PERCENTAGE,
			commissionValue: value,
		});

	const circleIdsOf = async (promoter: Promoter) =>
		(
			await dataSource
				.getRepository(CirclePromoter)
				.find({ where: { promoterId: promoter.promoterId } })
		).map((cp) => cp.circleId);

	describe('commission amounts', () => {
		it('a signup earns the fixed commission, referencing the contact', async () => {
			const m = await seedMerchant();
			await fixedOnSignUp(m, 10);

			const { contact_id } = await signUp(m);

			const [commission, ...rest] = await commissionsOf(m.promoter);
			expect(rest).toHaveLength(0);
			expect(commission).toMatchObject({
				conversionType: conversionTypeEnum.SIGNUP,
				amount: 10,
				revenue: 0,
				contactId: contact_id,
				referenceId: contact_id,
				linkId: m.link.linkId,
				promoterId: m.promoter.promoterId,
			});
		});

		it('a purchase earns the percentage of its amount, rounded to 2 places', async () => {
			const m = await seedMerchant();
			await percentOnPurchase(m, 7.5);

			const { purchase_id, contact_id } = await purchase(m, 123.45);

			const [commission, ...rest] = await commissionsOf(m.promoter);
			expect(rest).toHaveLength(0);
			// 7.5% of 123.45 = 9.25875
			expect(commission).toMatchObject({
				conversionType: conversionTypeEnum.PURCHASE,
				amount: 9.26,
				revenue: 123.45,
				contactId: contact_id,
				referenceId: purchase_id,
				linkId: m.link.linkId,
			});
		});

		it('a fixed purchase commission ignores the amount', async () => {
			const m = await seedMerchant();
			await createCommissionFunction(
				dataSource,
				m.program,
				m.defaultCircle,
				{
					trigger: triggerEnum.PURCHASE,
					commissionType: commissionTypeEnum.FIXED,
					commissionValue: 15,
				},
			);

			await purchase(m, 1000);

			const [commission] = await commissionsOf(m.promoter);
			expect(commission.amount).toBe(15);
			expect(commission.revenue).toBe(1000);
		});

		it('every matching function contributes its own commission', async () => {
			const m = await seedMerchant();
			await percentOnPurchase(m, 10);
			await percentOnPurchase(m, 5);

			await purchase(m, 200);

			const amounts = (await commissionsOf(m.promoter)).map(
				(c) => c.amount,
			);
			expect(amounts.sort((a, b) => a - b)).toEqual([10, 20]);
		});

		it('a function only fires for its own trigger', async () => {
			const m = await seedMerchant();
			await fixedOnSignUp(m, 10);
			await percentOnPurchase(m, 10);
			const email = uniqueEmail('both');

			await signUp(m, email);
			await purchase(m, 50, { email });

			const commissions = await commissionsOf(m.promoter);
			expect(
				commissions.map((c) => [c.conversionType, c.amount]),
			).toEqual(
				expect.arrayContaining([
					[conversionTypeEnum.SIGNUP, 10],
					[conversionTypeEnum.PURCHASE, 5],
				]),
			);
			expect(commissions).toHaveLength(2);
		});

		it('generates nothing when the program has no functions', async () => {
			const m = await seedMerchant();

			await signUp(m);
			await purchase(m, 100);

			expect(await commissionsOf(m.promoter)).toHaveLength(0);
		});
	});

	describe('gating', () => {
		it('an inactive function does not fire', async () => {
			const m = await seedMerchant();
			const func = await fixedOnSignUp(m, 10);
			await setFunctionStatus(
				dataSource,
				func,
				functionStatusEnum.INACTIVE,
			);

			await signUp(m);

			expect(await commissionsOf(m.promoter)).toHaveLength(0);
		});

		it("a function on a circle the promoter isn't in does not fire", async () => {
			const m = await seedMerchant();
			const vip = await createCircle(dataSource, m.program, 'VIP');
			await fixedOnSignUp(m, 10, vip);

			await signUp(m);

			expect(await commissionsOf(m.promoter)).toHaveLength(0);
		});

		it("another program's function does not fire", async () => {
			const m = await seedMerchant();
			const other = await seedMerchant();
			await fixedOnSignUp(other, 10);

			await signUp(m);

			expect(await commissionsOf(m.promoter)).toHaveLength(0);
		});

		it('a revenue >= X condition holds back commission until it is met', async () => {
			const m = await seedMerchant();
			const func = await percentOnPurchase(m, 10);
			await addCondition(
				dataSource,
				func,
				conditionParameterEnum.REVENUE,
				conditionOperatorEnum.GREATER_THAN_OR_EQUAL_TO,
				100,
			);

			await purchase(m, 50);
			expect(await commissionsOf(m.promoter)).toHaveLength(0);

			await purchase(m, 150);
			const commissions = await commissionsOf(m.promoter);
			expect(commissions).toHaveLength(1);
			expect(commissions[0]).toMatchObject({ amount: 15, revenue: 150 });
		});

		it("a no. of purchases condition counts the promoter's purchases so far", async () => {
			const m = await seedMerchant();
			const func = await percentOnPurchase(m, 10);
			await addCondition(
				dataSource,
				func,
				conditionParameterEnum.NUM_OF_PURCHASES,
				conditionOperatorEnum.GREATER_THAN_OR_EQUAL_TO,
				2,
			);

			await purchase(m, 100);
			expect(await commissionsOf(m.promoter)).toHaveLength(0);

			await purchase(m, 300);
			const commissions = await commissionsOf(m.promoter);
			expect(commissions).toHaveLength(1);
			expect(commissions[0].amount).toBe(30);
		});

		it('an item_id condition only matches that item', async () => {
			const m = await seedMerchant();
			const func = await percentOnPurchase(m, 10);
			await addCondition(
				dataSource,
				func,
				conditionParameterEnum.ITEM_ID,
				conditionOperatorEnum.EQUALS,
				'plan-pro',
			);

			await purchase(m, 100, { itemId: 'plan-basic' });
			expect(await commissionsOf(m.promoter)).toHaveLength(0);

			await purchase(m, 200, { itemId: 'plan-pro' });
			const commissions = await commissionsOf(m.promoter);
			expect(commissions).toHaveLength(1);
			expect(commissions[0].amount).toBe(20);
		});

		it('every condition must pass', async () => {
			const m = await seedMerchant();
			const func = await percentOnPurchase(m, 10);
			await addCondition(
				dataSource,
				func,
				conditionParameterEnum.REVENUE,
				conditionOperatorEnum.GREATER_THAN_OR_EQUAL_TO,
				100,
			);
			await addCondition(
				dataSource,
				func,
				conditionParameterEnum.ITEM_ID,
				conditionOperatorEnum.EQUALS,
				'plan-pro',
			);

			// Revenue passes, item doesn't.
			await purchase(m, 500, { itemId: 'plan-basic' });

			expect(await commissionsOf(m.promoter)).toHaveLength(0);
		});
	});

	describe('switch_circle effect', () => {
		it('moves the promoter into the target circle', async () => {
			const m = await seedMerchant();
			const gold = await createCircle(dataSource, m.program, 'Gold');
			await createSwitchCircleFunction(
				dataSource,
				m.program,
				m.defaultCircle,
				gold,
				triggerEnum.SIGNUP,
			);

			await signUp(m);

			expect(await circleIdsOf(m.promoter)).toEqual([gold.circleId]);
		});

		it("pays the old circle's commission for the triggering event, then the new circle's afterwards", async () => {
			const m = await seedMerchant();
			const gold = await createCircle(dataSource, m.program, 'Gold');
			await createSwitchCircleFunction(
				dataSource,
				m.program,
				m.defaultCircle,
				gold,
				triggerEnum.PURCHASE,
			);
			await percentOnPurchase(m, 10);
			await percentOnPurchase(m, 20, gold);

			// Commission functions run before circle switches, so the first
			// purchase is paid at the default circle's 10%.
			await purchase(m, 100);
			// The promoter is now in Gold: 20%, and the default circle's
			// function no longer applies.
			await purchase(m, 100);

			const amounts = (await commissionsOf(m.promoter)).map(
				(c) => c.amount,
			);
			expect(amounts.sort((a, b) => a - b)).toEqual([10, 20]);
			expect(await circleIdsOf(m.promoter)).toEqual([gold.circleId]);
		});

		it('respects its conditions', async () => {
			const m = await seedMerchant();
			const gold = await createCircle(dataSource, m.program, 'Gold');
			const func = await createSwitchCircleFunction(
				dataSource,
				m.program,
				m.defaultCircle,
				gold,
				triggerEnum.PURCHASE,
			);
			await addCondition(
				dataSource,
				func,
				conditionParameterEnum.REVENUE,
				conditionOperatorEnum.GREATER_THAN_OR_EQUAL_TO,
				1000,
			);

			await purchase(m, 100);

			expect(await circleIdsOf(m.promoter)).toEqual([
				m.defaultCircle.circleId,
			]);
		});

		it('does not fire for a promoter outside the source circle', async () => {
			const m = await seedMerchant();
			const silver = await createCircle(dataSource, m.program, 'Silver');
			const gold = await createCircle(dataSource, m.program, 'Gold');
			await createSwitchCircleFunction(
				dataSource,
				m.program,
				silver,
				gold,
				triggerEnum.SIGNUP,
			);

			await signUp(m);

			expect(await circleIdsOf(m.promoter)).toEqual([
				m.defaultCircle.circleId,
			]);
		});
	});
});
