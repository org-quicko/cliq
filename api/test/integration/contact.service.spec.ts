import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import { createProgram } from '../support/factories';
import { ContactService } from '../../src/services/contact.service';
import { Contact } from '../../src/entities';
import { CreateContactDto } from '../../src/dtos';
import { contactStatusEnum, referralKeyTypeEnum } from '../../src/enums';

/**
 * ContactService creates and looks up program-scoped contacts.
 * `contactExists` always joins through `program: { programId }`
 * (contact.service.ts:55-60), so a where-options match is only ever
 * considered within the given program, even when another program's contact
 * shares the same value.
 */
describe('ContactService', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let service: ContactService;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
		service = app.get(ContactService);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	function createDto(
		programId: string,
		overrides: Partial<CreateContactDto> = {},
	): CreateContactDto {
		return {
			programId,
			email: 'contact@test.local',
			...overrides,
		} as CreateContactDto;
	}

	describe('createContact', () => {
		it('persists the contact with the program relation set and defaults status to LEAD when omitted', async () => {
			const { program } = await createProgram(dataSource);

			const created = await service.createContact(
				createDto(program.programId),
			);

			const stored = await dataSource
				.getRepository(Contact)
				.findOneOrFail({
					where: { contactId: created.contactId },
					relations: { program: true },
				});
			expect(stored.program.programId).toBe(program.programId);
			expect(stored.programId).toBe(program.programId);
			expect(stored.status).toBe(contactStatusEnum.LEAD);
		});

		it('honors an explicit status in the body instead of the default', async () => {
			const { program } = await createProgram(dataSource);

			const created = await service.createContact(
				createDto(program.programId, {
					status: contactStatusEnum.ACTIVE,
				}),
			);

			const stored = await dataSource
				.getRepository(Contact)
				.findOneByOrFail({ contactId: created.contactId });
			expect(stored.status).toBe(contactStatusEnum.ACTIVE);
		});

		it('throws NotFoundException for a programId that does not exist', async () => {
			await expect(
				service.createContact(
					createDto('3f2504e0-4f89-11d3-9a0c-0305e82c3301'),
				),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe('contactExists', () => {
		it('scopes the lookup to the given program, even when another program has a contact with the same email', async () => {
			const { program: programA } = await createProgram(dataSource);
			const { program: programB } = await createProgram(dataSource);
			const email = 'shared@test.local';
			const contactA = await service.createContact(
				createDto(programA.programId, { email }),
			);
			const contactB = await service.createContact(
				createDto(programB.programId, { email }),
			);

			const foundInA = await service.contactExists(programA.programId, {
				email,
			});
			const foundInB = await service.contactExists(programB.programId, {
				email,
			});

			expect(foundInA?.contactId).toBe(contactA.contactId);
			expect(foundInB?.contactId).toBe(contactB.contactId);
		});

		it('returns null when no contact in the program matches the where options', async () => {
			const { program } = await createProgram(dataSource);

			const found = await service.contactExists(program.programId, {
				email: 'nobody@test.local',
			});

			expect(found).toBeNull();
		});
	});

	describe('changeContactStatus', () => {
		it('updates the status and leaves updatedAt no earlier than createdAt', async () => {
			const { program } = await createProgram(dataSource);
			const repo = dataSource.getRepository(Contact);
			const contact = await repo.save(
				repo.create({
					email: 'status@test.local',
					status: contactStatusEnum.LEAD,
					program,
				}),
			);

			await service.changeContactStatus(
				contact.contactId,
				contactStatusEnum.ACTIVE,
			);

			const updated = await repo.findOneByOrFail({
				contactId: contact.contactId,
			});
			expect(updated.status).toBe(contactStatusEnum.ACTIVE);
			expect(updated.updatedAt).toBeInstanceOf(Date);
			expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
				contact.createdAt.getTime(),
			);
		});
	});

	describe('verifyReferralKeyInput', () => {
		const dto = (overrides: Partial<CreateContactDto>): CreateContactDto =>
			({
				programId: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
				...overrides,
			}) as CreateContactDto;

		it('is false for EMAIL when the body has no email', () => {
			expect(
				service.verifyReferralKeyInput(
					referralKeyTypeEnum.EMAIL,
					dto({}),
				),
			).toBe(false);
		});

		it('is true for EMAIL when the body has an email', () => {
			expect(
				service.verifyReferralKeyInput(
					referralKeyTypeEnum.EMAIL,
					dto({ email: 'x@test.local' }),
				),
			).toBe(true);
		});

		it('is false for PHONE when the body has no phone, symmetrically', () => {
			expect(
				service.verifyReferralKeyInput(
					referralKeyTypeEnum.PHONE,
					dto({}),
				),
			).toBe(false);
		});

		it('is true for PHONE when the body has a phone, even alongside an email', () => {
			expect(
				service.verifyReferralKeyInput(
					referralKeyTypeEnum.PHONE,
					dto({ email: 'x@test.local', phone: '12345678' }),
				),
			).toBe(true);
		});
	});
});
