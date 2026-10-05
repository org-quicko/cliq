import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	INestApplication,
	NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import {
	createLink,
	createProgram,
	createPromoter,
	uniqueEmail,
} from '../support/factories';
import { SignUpService } from '../../src/services/signUp.service';
import { ApiKeyService } from '../../src/services/apiKey.service';
import { Contact, Link, SignUp } from '../../src/entities';
import { linkStatusEnum, referralKeyTypeEnum } from '../../src/enums';
import { CreateSignUpDto } from '../../src/dtos';
import { UtmParams } from '../../src/classes';
import {
	CONTACT_CREATED,
	ContactCreatedEvent,
	SIGNUP_CREATED,
	SignUpCreatedEvent,
} from '../../src/events';

const createDto = (overrides: Partial<CreateSignUpDto> = {}): CreateSignUpDto =>
	({
		refVal: 'ref-val',
		...overrides,
	}) as CreateSignUpDto;

/**
 * SignUpService.createSignUp is a link/api-key/referral-key gated create flow,
 * structurally close to PurchaseService.createPurchase, but it differs from
 * it in one important way: where a purchase reuses an existing contact,
 * signUp rejects the request with ConflictException when a contact matching
 * the program's referral key already exists (createSignUp `contactExists`
 * check). It also creates the Contact row itself, rather than requiring one
 * to pre-exist.
 *
 * Unlike PurchaseService (issues.md #34), createSignUp's own catch block
 * re-throws NotFoundException, ConflictException, ForbiddenException AND
 * BadRequestException, so the missing-referral-key case here is a genuine
 * 400, not the 500 bug documented for /purchases.
 */
describe('SignUpService', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let service: SignUpService;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
		service = app.get(SignUpService);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	/** An ACTIVE link, with a program-level API key valid for it. */
	async function seedActiveLink(
		referralKeyType: referralKeyTypeEnum = referralKeyTypeEnum.EMAIL,
	) {
		const { program, defaultCircle } = await createProgram(dataSource, {
			referralKeyType,
		});
		const { promoter } = await createPromoter(
			dataSource,
			program,
			defaultCircle,
		);
		const link = await createLink(dataSource, program, promoter);
		const apiKey = await app
			.get(ApiKeyService)
			.generateKey(program.programId);

		return { program, promoter, link, apiKey };
	}

	describe('createSignUp', () => {
		it('creates a new Contact and a SignUp row linked to the contact, link and promoter', async () => {
			const { program, promoter, link, apiKey } = await seedActiveLink();
			const email = uniqueEmail('signup');

			const result = await service.createSignUp(
				apiKey.apiKeyId,
				program.programId,
				createDto({
					refVal: link.refVal,
					email,
					firstName: 'Ada',
					lastName: 'Lovelace',
				}),
			);

			expect(result.linkId).toBe(link.linkId);
			expect(result.promoterId).toBe(promoter.promoterId);

			const contact = await dataSource
				.getRepository(Contact)
				.findOneByOrFail({ email });
			expect(contact.programId).toBe(program.programId);
			expect(contact.firstName).toBe('Ada');
			expect(contact.lastName).toBe('Lovelace');

			const signUp = await dataSource
				.getRepository(SignUp)
				.findOneByOrFail({ contactId: contact.contactId });
			expect(signUp.linkId).toBe(link.linkId);
			expect(signUp.promoterId).toBe(promoter.promoterId);
			// SignUp's primary key is the contact's id (a one-to-one on contact_id).
			expect(signUp.contactId).toBe(contact.contactId);
		});

		it('stores utmParams passed in the body on the SignUp row', async () => {
			const { program, link, apiKey } = await seedActiveLink();
			const email = uniqueEmail('signup');
			const utmParams = {
				utmSource: 'newsletter',
				utmMedium: 'email',
				utmCampaign: 'fall-sale',
			} as UtmParams;

			await service.createSignUp(
				apiKey.apiKeyId,
				program.programId,
				createDto({ refVal: link.refVal, email, utmParams }),
			);

			const contact = await dataSource
				.getRepository(Contact)
				.findOneByOrFail({ email });
			const signUp = await dataSource
				.getRepository(SignUp)
				.findOneByOrFail({ contactId: contact.contactId });

			expect(signUp.utmParams).toMatchObject(utmParams);
		});

		it('supports a PHONE referralKeyType program, matching and creating contacts by phone', async () => {
			const { program, promoter, link, apiKey } = await seedActiveLink(
				referralKeyTypeEnum.PHONE,
			);
			const phone = '15551234567';

			const result = await service.createSignUp(
				apiKey.apiKeyId,
				program.programId,
				createDto({ refVal: link.refVal, phone }),
			);

			expect(result.promoterId).toBe(promoter.promoterId);

			const contact = await dataSource
				.getRepository(Contact)
				.findOneByOrFail({ phone });
			expect(contact.programId).toBe(program.programId);
		});

		it('throws ConflictException when a contact matching the referral key already exists in the program', async () => {
			const { program, link, apiKey } = await seedActiveLink();
			const email = uniqueEmail('existing');
			await dataSource.getRepository(Contact).save(
				dataSource.getRepository(Contact).create({
					email,
					programId: program.programId,
				}),
			);

			await expect(
				service.createSignUp(
					apiKey.apiKeyId,
					program.programId,
					createDto({ refVal: link.refVal, email }),
				),
			).rejects.toBeInstanceOf(ConflictException);

			// Rejected, not silently reused: still exactly one contact row.
			expect(
				await dataSource.getRepository(Contact).countBy({ email }),
			).toBe(1);
			expect(await dataSource.getRepository(SignUp).count()).toBe(0);
		});

		it('throws BadRequestException when the body has neither email nor phone and the program requires one', async () => {
			const { program, link, apiKey } = await seedActiveLink(
				referralKeyTypeEnum.EMAIL,
			);

			await expect(
				service.createSignUp(
					apiKey.apiKeyId,
					program.programId,
					createDto({ refVal: link.refVal }),
				),
			).rejects.toBeInstanceOf(BadRequestException);

			expect(await dataSource.getRepository(SignUp).count()).toBe(0);
		});

		it('throws NotFoundException when the refVal does not match any ACTIVE link', async () => {
			const { program, link, apiKey } = await seedActiveLink();
			await dataSource
				.getRepository(Link)
				.update(
					{ linkId: link.linkId },
					{ status: linkStatusEnum.ARCHIVED },
				);

			await expect(
				service.createSignUp(
					apiKey.apiKeyId,
					program.programId,
					createDto({
						refVal: link.refVal,
						email: uniqueEmail('signup'),
					}),
				),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('throws NotFoundException when the refVal matches no link at all', async () => {
			const { program, apiKey } = await seedActiveLink();

			await expect(
				service.createSignUp(
					apiKey.apiKeyId,
					program.programId,
					createDto({
						refVal: 'no-such-ref',
						email: uniqueEmail('signup'),
					}),
				),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it("throws ForbiddenException when the given apiKeyId isn't valid for the link's own program", async () => {
			const { program, link } = await seedActiveLink();
			const { program: otherProgram } = await createProgram(dataSource);
			const foreignApiKey = await app
				.get(ApiKeyService)
				.generateKey(otherProgram.programId);

			await expect(
				service.createSignUp(
					foreignApiKey.apiKeyId,
					program.programId,
					createDto({
						refVal: link.refVal,
						email: uniqueEmail('signup'),
					}),
				),
			).rejects.toBeInstanceOf(ForbiddenException);
		});

		it('emits both SIGNUP_CREATED and CONTACT_CREATED with the right ids', async () => {
			const { program, promoter, link, apiKey } = await seedActiveLink();
			const email = uniqueEmail('signup');
			const emitter = app.get(EventEmitter2);

			const signUpEvents: SignUpCreatedEvent[] = [];
			const contactEvents: ContactCreatedEvent[] = [];
			emitter.once(SIGNUP_CREATED, (event: SignUpCreatedEvent) => {
				signUpEvents.push(event);
			});
			emitter.once(CONTACT_CREATED, (event: ContactCreatedEvent) => {
				contactEvents.push(event);
			});

			const result = await service.createSignUp(
				apiKey.apiKeyId,
				program.programId,
				createDto({ refVal: link.refVal, email }),
			);

			expect(signUpEvents).toHaveLength(1);
			expect(contactEvents).toHaveLength(1);

			const signUpEvent = signUpEvents[0];
			const signUpData = signUpEvent.data as unknown as Record<
				string,
				unknown
			>;
			expect(signUpEvent.programId).toBe(program.programId);
			expect(signUpEvent.promoterId).toBe(promoter.promoterId);
			expect(signUpData['signup_id']).toBe(result.contactId);
			expect(signUpData['contact_id']).toBe(result.contactId);
			expect(signUpData['link_id']).toBe(link.linkId);

			const contactEvent = contactEvents[0];
			const contactData = contactEvent.data as unknown as Record<
				string,
				unknown
			>;
			expect(contactEvent.programId).toBe(program.programId);
			expect(contactData['contact_id']).toBe(result.contactId);
			expect(contactData['email']).toBe(email);
		});
	});
});
