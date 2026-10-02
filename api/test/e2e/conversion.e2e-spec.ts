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
	createLink,
	createProgram,
	createPromoter,
	uniqueEmail,
} from '../support/factories';
import {
	archiveLink,
	ListenerTracker,
	trackEventListeners,
} from '../support/conversion-helpers';
import {
	Contact,
	Link,
	Program,
	Promoter,
	Purchase,
	SignUp,
} from '../../src/entities';
import { contactStatusEnum, referralKeyTypeEnum } from '../../src/enums';

/**
 * The conversion ingest path: a merchant's backend reports signups and
 * purchases with a program API key, naming the promoter's link by `ref_val`.
 * The contact is keyed by email or phone depending on the program's
 * `referralKeyType`. Commission side effects are covered in
 * commission.e2e-spec.ts; here the listeners are only drained so they can't
 * outlive the test's transaction.
 */
describe('conversions (e2e)', () => {
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

	// Registered after the transaction hooks, so it runs before the rollback.
	afterEach(async () => {
		await listeners?.settle();
	});

	interface Merchant {
		program: Program;
		promoter: Promoter;
		link: Link;
		credentials: ApiKeyCredentials;
	}

	async function seedMerchant(
		referralKeyType: referralKeyTypeEnum = referralKeyTypeEnum.EMAIL,
	): Promise<Merchant> {
		const { program, defaultCircle } = await createProgram(dataSource, {
			referralKeyType,
		});
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
		return { program, promoter, link, credentials };
	}

	async function postSignUp(
		credentials: ApiKeyCredentials,
		body: Record<string, unknown>,
	) {
		const response = await request(app.getHttpServer())
			.post('/api/signups')
			.set(apiKeyHeaders(credentials))
			.send(body);
		await listeners.settle();
		return response;
	}

	async function postPurchase(
		credentials: ApiKeyCredentials,
		body: Record<string, unknown>,
	) {
		const response = await request(app.getHttpServer())
			.post('/api/purchases')
			.set(apiKeyHeaders(credentials))
			.send(body);
		await listeners.settle();
		return response;
	}

	const contactsOf = (program: Program) =>
		dataSource
			.getRepository(Contact)
			.find({ where: { programId: program.programId } });

	describe('POST /signups', () => {
		it('creates a lead contact and a signup attributed to the link', async () => {
			const { program, promoter, link, credentials } =
				await seedMerchant();
			const email = uniqueEmail('lead');

			const response = await postSignUp(credentials, {
				ref_val: link.refVal,
				email,
				first_name: 'Ada',
				last_name: 'Lovelace',
				external_id: 'ext-1',
				utm_params: {
					utm_source: 'newsletter',
					utm_campaign: 'launch',
				},
			});

			expect(response.status).toBe(201);
			const data = response.body.data;
			expect(data).toMatchObject({
				link_id: link.linkId,
				promoter_id: promoter.promoterId,
				first_name: 'Ada',
				last_name: 'Lovelace',
				utm_params: {
					utm_source: 'newsletter',
					utm_campaign: 'launch',
				},
			});
			// The signup response masks the contact's email.
			expect(data.email).not.toBe(email);
			expect(data.email).toMatch(/\*+@test\.local$/);

			const contact = await dataSource
				.getRepository(Contact)
				.findOneByOrFail({ contactId: data.contact_id });
			expect(contact).toMatchObject({
				programId: program.programId,
				email,
				externalId: 'ext-1',
				status: contactStatusEnum.LEAD,
			});

			const signUp = await dataSource
				.getRepository(SignUp)
				.findOneByOrFail({ contactId: data.contact_id });
			expect(signUp.linkId).toBe(link.linkId);
			expect(signUp.promoterId).toBe(promoter.promoterId);
		});

		it('409s on a second signup for the same email, keeping one contact', async () => {
			const { program, link, credentials } = await seedMerchant();
			const email = uniqueEmail('dup');

			expect(
				(await postSignUp(credentials, { ref_val: link.refVal, email }))
					.status,
			).toBe(201);
			const second = await postSignUp(credentials, {
				ref_val: link.refVal,
				email,
			});

			expect(second.status).toBe(409);
			expect(await contactsOf(program)).toHaveLength(1);
		});

		it('keys contacts per program: the same email can sign up in two programs', async () => {
			const a = await seedMerchant();
			const b = await seedMerchant();
			const email = uniqueEmail('shared');

			expect(
				(
					await postSignUp(a.credentials, {
						ref_val: a.link.refVal,
						email,
					})
				).status,
			).toBe(201);
			expect(
				(
					await postSignUp(b.credentials, {
						ref_val: b.link.refVal,
						email,
					})
				).status,
			).toBe(201);
		});

		it('404s for an unknown ref_val', async () => {
			const { program, credentials } = await seedMerchant();

			const response = await postSignUp(credentials, {
				ref_val: 'no-such-link',
				email: uniqueEmail(),
			});

			expect(response.status).toBe(404);
			expect(await contactsOf(program)).toHaveLength(0);
		});

		it('404s for an archived link', async () => {
			const { program, link, credentials } = await seedMerchant();
			await archiveLink(dataSource, link);

			const response = await postSignUp(credentials, {
				ref_val: link.refVal,
				email: uniqueEmail(),
			});

			expect(response.status).toBe(404);
			expect(await contactsOf(program)).toHaveLength(0);
		});

		it("does not let program A's key record a signup on program B's link", async () => {
			const a = await seedMerchant();
			const b = await seedMerchant();

			// Links are resolved within the key's own program, so B's ref_val
			// simply doesn't exist from A's point of view.
			const response = await postSignUp(a.credentials, {
				ref_val: b.link.refVal,
				email: uniqueEmail(),
			});

			expect(response.status).toBe(404);
			expect(await contactsOf(a.program)).toHaveLength(0);
			expect(await contactsOf(b.program)).toHaveLength(0);
		});

		it('400s when the email the program keys on is missing', async () => {
			const { program, link, credentials } = await seedMerchant();

			const response = await postSignUp(credentials, {
				ref_val: link.refVal,
				phone: '9876543210',
			});

			expect(response.status).toBe(400);
			expect(await contactsOf(program)).toHaveLength(0);
		});

		it.each([
			['a malformed email', { email: 'not-an-email' }],
			[
				'a phone with letters',
				{ email: uniqueEmail(), phone: '98765abc10' },
			],
			[
				'a phone that is too short',
				{ email: uniqueEmail(), phone: '1234' },
			],
			[
				'a phone that is too long',
				{ email: uniqueEmail(), phone: '12345678901234' },
			],
			['an undeclared property', { email: uniqueEmail(), amount: 10 }],
		])('400s on %s', async (_label, fields) => {
			const { program, link, credentials } = await seedMerchant();

			const response = await postSignUp(credentials, {
				ref_val: link.refVal,
				...fields,
			});

			expect(response.status).toBe(400);
			expect(await contactsOf(program)).toHaveLength(0);
		});

		it('400s without a ref_val', async () => {
			const { credentials } = await seedMerchant();

			const response = await postSignUp(credentials, {
				email: uniqueEmail(),
			});

			expect(response.status).toBe(400);
		});

		it('401s without API key credentials', async () => {
			const { program, link } = await seedMerchant();

			await request(app.getHttpServer())
				.post('/api/signups')
				.send({ ref_val: link.refVal, email: uniqueEmail() })
				.expect(401);

			expect(await contactsOf(program)).toHaveLength(0);
		});

		it('401s with a wrong API secret', async () => {
			const { program, link, credentials } = await seedMerchant();

			await request(app.getHttpServer())
				.post('/api/signups')
				.set(apiKeyHeaders({ ...credentials, secret: 'wrong' }))
				.send({ ref_val: link.refVal, email: uniqueEmail() })
				.expect(401);

			expect(await contactsOf(program)).toHaveLength(0);
		});

		describe('phone-keyed program', () => {
			it('creates the contact from the phone number', async () => {
				const { program, link, credentials } = await seedMerchant(
					referralKeyTypeEnum.PHONE,
				);

				const response = await postSignUp(credentials, {
					ref_val: link.refVal,
					phone: '9876543210',
				});

				expect(response.status).toBe(201);
				const [contact] = await contactsOf(program);
				expect(contact.phone).toBe('9876543210');
				expect(contact.email).toBeNull();
			});

			it('400s without a phone even when an email is given', async () => {
				const { program, link, credentials } = await seedMerchant(
					referralKeyTypeEnum.PHONE,
				);

				const response = await postSignUp(credentials, {
					ref_val: link.refVal,
					email: uniqueEmail(),
				});

				expect(response.status).toBe(400);
				expect(await contactsOf(program)).toHaveLength(0);
			});

			it('dedupes on phone, not email', async () => {
				const { program, link, credentials } = await seedMerchant(
					referralKeyTypeEnum.PHONE,
				);

				await postSignUp(credentials, {
					ref_val: link.refVal,
					phone: '9876543210',
					email: uniqueEmail(),
				});
				const second = await postSignUp(credentials, {
					ref_val: link.refVal,
					phone: '9876543210',
					email: uniqueEmail(),
				});

				expect(second.status).toBe(409);
				expect(await contactsOf(program)).toHaveLength(1);
			});
		});
	});

	describe('POST /purchases', () => {
		it('creates an active contact and the purchase for a new customer', async () => {
			const { program, promoter, link, credentials } =
				await seedMerchant();
			const email = uniqueEmail('buyer');

			const response = await postPurchase(credentials, {
				ref_val: link.refVal,
				email,
				amount: 199.99,
				item_id: 'plan-pro',
				utm_params: { utm_source: 'blog' },
			});

			expect(response.status).toBe(201);
			const data = response.body.data;
			expect(data).toMatchObject({
				link_id: link.linkId,
				promoter_id: promoter.promoterId,
				amount: 199.99,
				item_id: 'plan-pro',
				email,
				utm_params: { utm_source: 'blog' },
			});

			const [contact] = await contactsOf(program);
			expect(contact.contactId).toBe(data.contact_id);
			expect(contact.status).toBe(contactStatusEnum.ACTIVE);

			const purchase = await dataSource
				.getRepository(Purchase)
				.findOneByOrFail({ purchaseId: data.purchase_id });
			expect(purchase).toMatchObject({
				amount: 199.99,
				itemId: 'plan-pro',
				linkId: link.linkId,
				promoterId: promoter.promoterId,
			});
		});

		it('attaches to the contact an earlier signup created and activates it', async () => {
			const { program, link, credentials } = await seedMerchant();
			const email = uniqueEmail('lead');
			const signUp = await postSignUp(credentials, {
				ref_val: link.refVal,
				email,
			});
			const contactId = signUp.body.data.contact_id;

			const response = await postPurchase(credentials, {
				ref_val: link.refVal,
				email,
				amount: 49,
				item_id: 'plan-basic',
			});

			expect(response.status).toBe(201);
			expect(response.body.data.contact_id).toBe(contactId);

			const contacts = await contactsOf(program);
			expect(contacts).toHaveLength(1);
			expect(contacts[0].status).toBe(contactStatusEnum.ACTIVE);
		});

		it('records repeat purchases against one contact', async () => {
			const { program, link, credentials } = await seedMerchant();
			const email = uniqueEmail('repeat');

			for (const amount of [10, 20]) {
				const response = await postPurchase(credentials, {
					ref_val: link.refVal,
					email,
					amount,
					item_id: 'item',
				});
				expect(response.status).toBe(201);
			}

			const [contact, ...others] = await contactsOf(program);
			expect(others).toHaveLength(0);
			const purchases = await dataSource
				.getRepository(Purchase)
				.find({ where: { contact: { contactId: contact.contactId } } });
			expect(
				purchases.map((p) => p.amount).sort((x, y) => x - y),
			).toEqual([10, 20]);
		});

		it('accepts a zero amount', async () => {
			const { link, credentials } = await seedMerchant();

			const response = await postPurchase(credentials, {
				ref_val: link.refVal,
				email: uniqueEmail(),
				amount: 0,
				item_id: 'free-trial',
			});

			expect(response.status).toBe(201);
			expect(response.body.data.amount).toBe(0);
		});

		it('404s for an unknown ref_val', async () => {
			const { program, credentials } = await seedMerchant();

			const response = await postPurchase(credentials, {
				ref_val: 'no-such-link',
				email: uniqueEmail(),
				amount: 10,
				item_id: 'item',
			});

			expect(response.status).toBe(404);
			expect(await contactsOf(program)).toHaveLength(0);
		});

		it('404s for an archived link', async () => {
			const { program, link, credentials } = await seedMerchant();
			await archiveLink(dataSource, link);

			const response = await postPurchase(credentials, {
				ref_val: link.refVal,
				email: uniqueEmail(),
				amount: 10,
				item_id: 'item',
			});

			expect(response.status).toBe(404);
			expect(await contactsOf(program)).toHaveLength(0);
		});

		it("does not let program A's key record a purchase on program B's link", async () => {
			const a = await seedMerchant();
			const b = await seedMerchant();

			const response = await postPurchase(a.credentials, {
				ref_val: b.link.refVal,
				email: uniqueEmail(),
				amount: 10,
				item_id: 'item',
			});

			expect(response.status).toBe(404);
			expect(await dataSource.getRepository(Purchase).count()).toBe(0);
		});

		it.each([
			['a negative amount', { amount: -1 }],
			['a non-numeric amount', { amount: 'lots' }],
			['a missing amount', { amount: undefined }],
			['a missing item_id', { item_id: undefined }],
			['a phone with letters', { phone: '98765abc10' }],
			['a malformed email', { email: 'not-an-email' }],
			[
				'an undeclared property',
				{ promoter_id: '00000000-0000-0000-0000-000000000000' },
			],
		])('400s on %s', async (_label, fields) => {
			const { link, credentials } = await seedMerchant();

			const response = await postPurchase(credentials, {
				ref_val: link.refVal,
				email: uniqueEmail(),
				amount: 10,
				item_id: 'item',
				...fields,
			});

			expect(response.status).toBe(400);
			expect(await dataSource.getRepository(Purchase).count()).toBe(0);
		});

		it('401s without API key credentials', async () => {
			const { link } = await seedMerchant();

			await request(app.getHttpServer())
				.post('/api/purchases')
				.send({
					ref_val: link.refVal,
					email: uniqueEmail(),
					amount: 10,
					item_id: 'item',
				})
				.expect(401);

			expect(await dataSource.getRepository(Purchase).count()).toBe(0);
		});

		describe('phone-keyed program', () => {
			it('matches the purchase to the signed-up contact by phone', async () => {
				const { program, link, credentials } = await seedMerchant(
					referralKeyTypeEnum.PHONE,
				);
				const signUp = await postSignUp(credentials, {
					ref_val: link.refVal,
					phone: '9876543210',
				});

				const response = await postPurchase(credentials, {
					ref_val: link.refVal,
					phone: '9876543210',
					// A different email must not split the contact.
					email: uniqueEmail(),
					amount: 75,
					item_id: 'item',
				});

				expect(response.status).toBe(201);
				expect(response.body.data.contact_id).toBe(
					signUp.body.data.contact_id,
				);
				expect(await contactsOf(program)).toHaveLength(1);
			});
		});
	});
});
