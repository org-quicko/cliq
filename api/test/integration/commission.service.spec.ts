import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import {
	createLink,
	createProgram,
	createPromoter,
	unique,
	uniqueEmail,
} from '../support/factories';
import { CommissionService } from '../../src/services/commission.service';
import { COMMISSION_CREATED } from '../../src/events/CommissionCreated.event';
import { Commission, Contact, Program } from '../../src/entities';
import { CreateCommissionDto } from '../../src/dtos';
import { conversionTypeEnum } from '../../src/enums';

/**
 * There is no shared factory for Contact yet, so this spec seeds it directly
 * through the repository the same way `factories.ts` does for other entities.
 */
async function createContact(
	dataSource: DataSource,
	program: Program,
	overrides: Partial<
		Pick<Contact, 'email' | 'firstName' | 'lastName' | 'externalId'>
	> = {},
): Promise<Contact> {
	const repo = dataSource.getRepository(Contact);
	return repo.save(
		repo.create({
			email: overrides.email ?? uniqueEmail('contact'),
			firstName: overrides.firstName ?? 'Test',
			lastName: overrides.lastName ?? 'Contact',
			externalId: overrides.externalId,
			program: { programId: program.programId } as Program,
		}),
	);
}

describe('CommissionService (integration)', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let service: CommissionService;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
		service = app.get(CommissionService);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	async function seedFixtures() {
		const { program, defaultCircle } = await createProgram(dataSource);
		const { promoter } = await createPromoter(
			dataSource,
			program,
			defaultCircle,
		);
		const link = await createLink(dataSource, program, promoter);
		const contact = await createContact(dataSource, program);
		return { program, promoter, link, contact };
	}

	const createDto = (
		overrides: Partial<CreateCommissionDto> = {},
	): CreateCommissionDto =>
		({
			contactId: overrides.contactId,
			conversionType:
				overrides.conversionType ?? conversionTypeEnum.PURCHASE,
			referenceId: overrides.referenceId ?? crypto.randomUUID(),
			promoterId: overrides.promoterId,
			linkId: overrides.linkId,
			amount: overrides.amount ?? 100,
			revenue: overrides.revenue ?? 50,
		}) as CreateCommissionDto;

	describe('createCommission', () => {
		it('persists the commission with the given amount/revenue/conversionType and relations', async () => {
			const { promoter, link, contact } = await seedFixtures();

			const saved = await service.createCommission(
				createDto({
					contactId: contact.contactId,
					promoterId: promoter.promoterId,
					linkId: link.linkId,
					conversionType: conversionTypeEnum.SIGNUP,
					amount: 123.45,
					revenue: 67.89,
				}),
			);

			expect(saved.contactId).toBe(contact.contactId);
			expect(saved.promoterId).toBe(promoter.promoterId);
			expect(saved.linkId).toBe(link.linkId);
			expect(saved.conversionType).toBe(conversionTypeEnum.SIGNUP);
			expect(saved.amount).toBe(123.45);
			expect(saved.revenue).toBe(67.89);

			const stored = await dataSource
				.getRepository(Commission)
				.findOneByOrFail({ commissionId: saved.commissionId });
			expect(stored.contactId).toBe(contact.contactId);
			expect(stored.promoterId).toBe(promoter.promoterId);
			expect(stored.linkId).toBe(link.linkId);
			expect(stored.conversionType).toBe(conversionTypeEnum.SIGNUP);
		});

		it('reads amount and revenue back as JS numbers, not strings, via the NumericToNumber transformer', async () => {
			const { promoter, link, contact } = await seedFixtures();

			const saved = await service.createCommission(
				createDto({
					contactId: contact.contactId,
					promoterId: promoter.promoterId,
					linkId: link.linkId,
					amount: 199.99,
					revenue: 89.5,
				}),
			);

			const stored = await dataSource
				.getRepository(Commission)
				.findOneByOrFail({ commissionId: saved.commissionId });

			expect(typeof stored.amount).toBe('number');
			expect(typeof stored.revenue).toBe('number');
			expect(stored.amount).toBe(199.99);
			expect(stored.revenue).toBe(89.5);
		});

		it('emits a COMMISSION_CREATED event with the commission, contact, promoter and link ids', async () => {
			const { program, promoter, link, contact } = await seedFixtures();
			const emitter = app.get(EventEmitter2);

			const received = new Promise<any>((resolve) => {
				emitter.once(COMMISSION_CREATED, (event) => resolve(event));
			});

			const saved = await service.createCommission(
				createDto({
					contactId: contact.contactId,
					promoterId: promoter.promoterId,
					linkId: link.linkId,
					conversionType: conversionTypeEnum.PURCHASE,
					amount: 42,
					revenue: 21,
				}),
			);

			const event = await received;
			expect(event.programId).toBe(program.programId);
			expect(event.promoterId).toBe(promoter.promoterId);
			expect(event.data['commission_id']).toBe(saved.commissionId);
			expect(event.data['contact_id']).toBe(contact.contactId);
			expect(event.data['promoter_id']).toBe(promoter.promoterId);
			expect(event.data['link_id']).toBe(link.linkId);
			expect(event.data['conversion_type']).toBe(
				conversionTypeEnum.PURCHASE,
			);
			expect(event.data['amount']).toBe(42);
			expect(event.data['revenue']).toBe(21);
		});

		it("includes the contact's external_id in the event payload", async () => {
			const { promoter, link, program } = await seedFixtures();
			const contact = await createContact(dataSource, program, {
				externalId: unique('external'),
			});
			const emitter = app.get(EventEmitter2);

			const received = new Promise<any>((resolve) => {
				emitter.once(COMMISSION_CREATED, (event) => resolve(event));
			});

			await service.createCommission(
				createDto({
					contactId: contact.contactId,
					promoterId: promoter.promoterId,
					linkId: link.linkId,
				}),
			);

			const event = await received;
			expect(event.data['external_id']).toBe(contact.externalId);
		});

		it('allows two commissions for the same contact/promoter/link without conflict', async () => {
			const { promoter, link, contact } = await seedFixtures();

			const first = await service.createCommission(
				createDto({
					contactId: contact.contactId,
					promoterId: promoter.promoterId,
					linkId: link.linkId,
					amount: 10,
					revenue: 5,
				}),
			);
			const second = await service.createCommission(
				createDto({
					contactId: contact.contactId,
					promoterId: promoter.promoterId,
					linkId: link.linkId,
					amount: 20,
					revenue: 15,
				}),
			);

			expect(first.commissionId).not.toBe(second.commissionId);

			const count = await dataSource.getRepository(Commission).countBy({
				contactId: contact.contactId,
				promoterId: promoter.promoterId,
				linkId: link.linkId,
			});
			expect(count).toBe(2);
		});
	});
});
