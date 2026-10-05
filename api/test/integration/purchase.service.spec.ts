import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
	INestApplication,
	ForbiddenException,
	NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import { archiveLink } from '../support/conversion-helpers';
import {
	createProgram,
	createPromoter,
	createLink,
	unique,
} from '../support/factories';
import { PurchaseService } from '../../src/services/purchase.service';
import { CreatePurchaseDto } from '../../src/dtos';
import { ApiKey, Contact, Program, Purchase } from '../../src/entities';
import {
	contactStatusEnum,
	referralKeyTypeEnum,
	statusEnum,
} from '../../src/enums';
import { PURCHASE_CREATED, PurchaseCreatedEvent } from '../../src/events';

/**
 * Issue 34 in issues.md: createPurchase's catch block only re-throws
 * NotFoundException and ForbiddenException as-is; every other error
 * (including the BadRequestException it raises itself for a missing
 * referral key) is wrapped into a 500. No test here exercises that path,
 * per the repo convention of leaving known bugs out of the suites.
 */
describe('PurchaseService', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let service: PurchaseService;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
		service = app.get(PurchaseService);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	function purchaseBody(
		refVal: string,
		overrides: Partial<CreatePurchaseDto> = {},
	): CreatePurchaseDto {
		return {
			refVal,
			amount: 250,
			itemId: unique('item'),
			...overrides,
		} as CreatePurchaseDto;
	}

	function uniquePhone(): string {
		return `9${Math.floor(100000000 + Math.random() * 899999999)}`;
	}

	/** A program-level, active API key row; createPurchase only checks programId + apiKeyId. */
	async function insertApiKey(program: Program): Promise<ApiKey> {
		const repo = dataSource.getRepository(ApiKey);
		return repo.save(
			repo.create({
				key: unique('key'),
				secret: unique('secret'),
				status: statusEnum.ACTIVE,
				programId: program.programId,
				promoterId: null,
			}),
		);
	}

	async function insertContact(
		program: Program,
		overrides: Partial<Pick<Contact, 'email' | 'phone' | 'status'>> = {},
	): Promise<Contact> {
		const repo = dataSource.getRepository(Contact);
		return repo.save(
			repo.create({
				email: overrides.email,
				phone: overrides.phone,
				status: overrides.status ?? contactStatusEnum.LEAD,
				programId: program.programId,
			} as Partial<Contact>),
		);
	}

	describe('happy path', () => {
		it('creates a purchase linked to the right link, promoter and contact', async () => {
			const { program, defaultCircle } = await createProgram(dataSource, {
				referralKeyType: referralKeyTypeEnum.EMAIL,
			});
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const link = await createLink(dataSource, program, promoter);
			const apiKey = await insertApiKey(program);
			const email = 'buyer@example.com';

			const result = await service.createPurchase(
				apiKey.apiKeyId,
				program.programId,
				purchaseBody(link.refVal, {
					email,
					amount: 499,
					itemId: 'sku-1',
				}),
			);

			expect(result.amount).toBe(499);
			expect(result.itemId).toBe('sku-1');
			expect(result.linkId).toBe(link.linkId);
			expect(result.promoterId).toBe(promoter.promoterId);

			const stored = await dataSource
				.getRepository(Purchase)
				.findOneByOrFail({ purchaseId: result.purchaseId });
			expect(stored.linkId).toBe(link.linkId);
			expect(stored.promoterId).toBe(promoter.promoterId);
			expect(stored.contactId).toBe(result.contactId);
		});

		it('round-trips utm_params into the stored purchase row', async () => {
			const { program, defaultCircle } = await createProgram(dataSource, {
				referralKeyType: referralKeyTypeEnum.EMAIL,
			});
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const link = await createLink(dataSource, program, promoter);
			const apiKey = await insertApiKey(program);

			const result = await service.createPurchase(
				apiKey.apiKeyId,
				program.programId,
				purchaseBody(link.refVal, {
					email: 'utm-buyer@example.com',
					utmParams: {
						utmSource: 'newsletter',
						utmCampaign: 'q3-launch',
					} as never,
				}),
			);

			const stored = await dataSource
				.getRepository(Purchase)
				.findOneByOrFail({ purchaseId: result.purchaseId });
			expect(stored.utmParams).toMatchObject({
				utmSource: 'newsletter',
				utmCampaign: 'q3-launch',
			});
		});
	});

	describe('contact matching', () => {
		it('reuses an existing contact matched by email rather than creating a duplicate', async () => {
			const { program, defaultCircle } = await createProgram(dataSource, {
				referralKeyType: referralKeyTypeEnum.EMAIL,
			});
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const link = await createLink(dataSource, program, promoter);
			const apiKey = await insertApiKey(program);
			const email = 'existing@example.com';
			const existing = await insertContact(program, {
				email,
				status: contactStatusEnum.LEAD,
			});

			const result = await service.createPurchase(
				apiKey.apiKeyId,
				program.programId,
				purchaseBody(link.refVal, { email }),
			);

			expect(result.contactId).toBe(existing.contactId);

			const contacts = await dataSource
				.getRepository(Contact)
				.countBy({ programId: program.programId });
			expect(contacts).toBe(1);

			// The reused contact is (re)activated as part of the purchase, not left as a lead.
			const refreshed = await dataSource
				.getRepository(Contact)
				.findOneByOrFail({ contactId: existing.contactId });
			expect(refreshed.status).toBe(contactStatusEnum.ACTIVE);
		});

		it('reuses an existing contact matched by phone when the program keys on phone', async () => {
			const { program, defaultCircle } = await createProgram(dataSource, {
				referralKeyType: referralKeyTypeEnum.PHONE,
			});
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const link = await createLink(dataSource, program, promoter);
			const apiKey = await insertApiKey(program);
			const phone = uniquePhone();
			const existing = await insertContact(program, {
				phone,
				status: contactStatusEnum.LEAD,
			});

			const result = await service.createPurchase(
				apiKey.apiKeyId,
				program.programId,
				purchaseBody(link.refVal, { phone }),
			);

			expect(result.contactId).toBe(existing.contactId);
			expect(
				await dataSource
					.getRepository(Contact)
					.countBy({ programId: program.programId }),
			).toBe(1);
		});

		it('creates a new, ACTIVE contact when none matches', async () => {
			const { program, defaultCircle } = await createProgram(dataSource, {
				referralKeyType: referralKeyTypeEnum.EMAIL,
			});
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const link = await createLink(dataSource, program, promoter);
			const apiKey = await insertApiKey(program);
			const email = 'brand-new@example.com';

			const result = await service.createPurchase(
				apiKey.apiKeyId,
				program.programId,
				purchaseBody(link.refVal, { email }),
			);

			const created = await dataSource
				.getRepository(Contact)
				.findOneByOrFail({ contactId: result.contactId });
			expect(created.email).toBe(email);
			expect(created.status).toBe(contactStatusEnum.ACTIVE);
		});
	});

	describe('link resolution', () => {
		it('throws NotFoundException when refVal matches no link at all', async () => {
			const { program } = await createProgram(dataSource, {
				referralKeyType: referralKeyTypeEnum.EMAIL,
			});
			const apiKey = await insertApiKey(program);

			await expect(
				service.createPurchase(
					apiKey.apiKeyId,
					program.programId,
					purchaseBody(unique('missing-ref'), {
						email: 'nobody@example.com',
					}),
				),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('throws NotFoundException when the matching link is archived', async () => {
			const { program, defaultCircle } = await createProgram(dataSource, {
				referralKeyType: referralKeyTypeEnum.EMAIL,
			});
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const link = await createLink(dataSource, program, promoter);
			await archiveLink(dataSource, link);
			const apiKey = await insertApiKey(program);

			await expect(
				service.createPurchase(
					apiKey.apiKeyId,
					program.programId,
					purchaseBody(link.refVal, {
						email: 'archived-link@example.com',
					}),
				),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe('api key scoping', () => {
		it('throws ForbiddenException when the api key belongs to a different program', async () => {
			const { program: programA, defaultCircle: circleA } =
				await createProgram(dataSource, {
					referralKeyType: referralKeyTypeEnum.EMAIL,
				});
			const { promoter } = await createPromoter(
				dataSource,
				programA,
				circleA,
			);
			const link = await createLink(dataSource, programA, promoter);

			const { program: programB } = await createProgram(dataSource, {
				referralKeyType: referralKeyTypeEnum.EMAIL,
			});
			const foreignApiKey = await insertApiKey(programB);

			await expect(
				service.createPurchase(
					foreignApiKey.apiKeyId,
					programA.programId,
					purchaseBody(link.refVal, {
						email: 'cross-program@example.com',
					}),
				),
			).rejects.toBeInstanceOf(ForbiddenException);
		});
	});

	describe('events', () => {
		it('emits PURCHASE_CREATED with the purchase, contact, promoter and link ids', async () => {
			const { program, defaultCircle } = await createProgram(dataSource, {
				referralKeyType: referralKeyTypeEnum.EMAIL,
			});
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const link = await createLink(dataSource, program, promoter);
			const apiKey = await insertApiKey(program);
			const emitter = app.get(EventEmitter2);

			let received: PurchaseCreatedEvent | undefined;
			emitter.once(PURCHASE_CREATED, (event: PurchaseCreatedEvent) => {
				received = event;
			});

			const result = await service.createPurchase(
				apiKey.apiKeyId,
				program.programId,
				purchaseBody(link.refVal, {
					email: 'event-buyer@example.com',
					itemId: 'sku-event',
					amount: 77,
				}),
			);

			expect(received).toBeDefined();
			expect(received?.programId).toBe(program.programId);
			expect(received?.promoterId).toBe(promoter.promoterId);

			const data = received?.data as unknown as Record<string, unknown>;
			expect(data['purchase_id']).toBe(result.purchaseId);
			expect(data['contact_id']).toBe(result.contactId);
			expect(data['promoter_id']).toBe(promoter.promoterId);
			expect(data['link_id']).toBe(link.linkId);
			expect(data['item_id']).toBe('sku-event');
			expect(data['amount']).toBe(77);
		});
	});
});
