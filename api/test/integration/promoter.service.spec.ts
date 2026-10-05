import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
	BadRequestException,
	ConflictException,
	INestApplication,
	NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import {
	createMember,
	createProgram,
	createPromoter,
	uniqueEmail,
} from '../support/factories';
import { PromoterService } from '../../src/services/promoter.service';
import {
	CirclePromoter,
	Member,
	ProgramPromoter,
	Promoter,
	PromoterMember,
} from '../../src/entities';
import {
	memberRoleEnum,
	promoterStatusEnum,
	statusEnum,
	visibilityEnum,
} from '../../src/enums';

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

/**
 * PromoterService is the single most bug-flagged file in issues.md. These
 * specs stick to the branches that are genuinely correct today: registration
 * and terms-acceptance, plain not-found lookups, membership existence checks
 * and role/removal/deletion paths that don't depend on the caller-supplied
 * IDs actually being scoped correctly.
 *
 * Deliberately NOT covered here (pre-existing bugs, see issues.md):
 *  - updateRole and deletePromoter only filter by memberId, not promoterId
 *    (issues 5, 19) — no cross-promoter scoping is asserted.
 *  - memberExistsInPromoter never checks the program (issue 12).
 *  - addMember's "invite an existing memberless member" 404s instead of
 *    linking them (issue 29) — only the clean brand-new-email and
 *    reactivation-of-a-removed-member branches are exercised.
 *  - removeMember silently no-ops for a mismatched promoter/member pair
 *    (issue 30) — not asserted either way here.
 *  - getCommissionsReport/streamCommissions crashes on `c.external_id`
 *    (issue 35) — not called.
 */
describe('PromoterService', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let service: PromoterService;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
		service = app.get(PromoterService);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	/** A promoter row with no ProgramPromoter/PromoterMember/CirclePromoter wiring yet. */
	async function createBarePromoter(name = 'Bare Promoter') {
		const repo = dataSource.getRepository(Promoter);
		return repo.save(repo.create({ name }));
	}

	describe('registerForProgram', () => {
		it('registers a new promoter into a public program and its default circle', async () => {
			const { program, defaultCircle } = await createProgram(dataSource, {
				visibility: visibilityEnum.PUBLIC,
			});
			const promoter = await createBarePromoter();

			const dto = await service.registerForProgram(
				true,
				program.programId,
				promoter.promoterId,
			);

			expect(dto.acceptedTermsAndConditions).toBe(true);

			const programPromoter = await dataSource
				.getRepository(ProgramPromoter)
				.findOneByOrFail({
					programId: program.programId,
					promoterId: promoter.promoterId,
				});
			expect(programPromoter.acceptedTermsAndConditions).toBe(true);

			const circlePromoter = await dataSource
				.getRepository(CirclePromoter)
				.findOneBy({
					circleId: defaultCircle.circleId,
					promoterId: promoter.promoterId,
				});
			expect(circlePromoter).not.toBeNull();
		});

		it('records a not-yet-accepted registration without assigning a circle', async () => {
			const { program } = await createProgram(dataSource);
			const promoter = await createBarePromoter();

			await service.registerForProgram(
				false,
				program.programId,
				promoter.promoterId,
			);

			const programPromoter = await dataSource
				.getRepository(ProgramPromoter)
				.findOneByOrFail({
					programId: program.programId,
					promoterId: promoter.promoterId,
				});
			expect(programPromoter.acceptedTermsAndConditions).toBe(false);

			const circlePromoterCount = await dataSource
				.getRepository(CirclePromoter)
				.countBy({ promoterId: promoter.promoterId });
			expect(circlePromoterCount).toBe(0);
		});

		it('rejects a second registration once terms were already accepted', async () => {
			const { program } = await createProgram(dataSource);
			const promoter = await createBarePromoter();
			await service.registerForProgram(
				true,
				program.programId,
				promoter.promoterId,
			);

			await expect(
				service.registerForProgram(
					true,
					program.programId,
					promoter.promoterId,
				),
			).rejects.toThrow(ConflictException);
		});

		it('refuses to register into a private program', async () => {
			const { program } = await createProgram(dataSource, {
				visibility: visibilityEnum.PRIVATE,
			});
			const promoter = await createBarePromoter();

			await expect(
				service.registerForProgram(
					true,
					program.programId,
					promoter.promoterId,
				),
			).rejects.toThrow(BadRequestException);
		});
	});

	describe('hasAcceptedTermsAndConditions', () => {
		it('throws when the promoter has not accepted terms for the program', async () => {
			const { program } = await createProgram(dataSource);
			const promoter = await createBarePromoter();
			await dataSource.getRepository(ProgramPromoter).save({
				programId: program.programId,
				promoterId: promoter.promoterId,
				acceptedTermsAndConditions: false,
			});

			await expect(
				service.hasAcceptedTermsAndConditions(
					program.programId,
					promoter.promoterId,
				),
			).rejects.toThrow(BadRequestException);
		});

		it('resolves silently once terms have been accepted', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await expect(
				service.hasAcceptedTermsAndConditions(
					program.programId,
					promoter.promoterId,
				),
			).resolves.toBeUndefined();
		});
	});

	describe('getPromoterEntity', () => {
		it('throws NotFoundException for an unknown promoterId', async () => {
			await expect(service.getPromoterEntity(UNKNOWN_ID)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('getPromoter', () => {
		it('throws NotFoundException when the promoter never joined that program', async () => {
			const { program: programA, defaultCircle: circleA } =
				await createProgram(dataSource);
			const { program: programB } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				programA,
				circleA,
			);

			await expect(
				service.getPromoter(programB.programId, promoter.promoterId),
			).rejects.toThrow(NotFoundException);
		});

		it('returns the promoter with its terms-acceptance for that program', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
				{
					name: 'Visible Promoter',
				},
			);

			const dto = await service.getPromoter(
				program.programId,
				promoter.promoterId,
			);

			expect(dto.name).toBe('Visible Promoter');
			expect(dto.acceptedTermsAndConditions).toBe(true);
		});
	});

	describe('memberExistsInPromoter', () => {
		it('returns the given subject when the member belongs to the promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			const result = await service.memberExistsInPromoter(
				member.memberId,
				promoter.promoterId,
				'all',
			);

			expect(result).toBe('all');
		});

		it("returns null when the member doesn't belong to the promoter", async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const outsider = await createMember(dataSource, program);

			const result = await service.memberExistsInPromoter(
				outsider.memberId,
				promoter.promoterId,
				'all',
			);

			expect(result).toBeNull();
		});
	});

	describe('updatePromoterInfo', () => {
		it('persists a renamed promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			const dto = await service.updatePromoterInfo(
				program.programId,
				promoter.promoterId,
				{
					name: 'Renamed Promoter',
				},
			);

			expect(dto.name).toBe('Renamed Promoter');
			expect(dto.acceptedTermsAndConditions).toBe(true);

			const stored = await dataSource
				.getRepository(Promoter)
				.findOneByOrFail({ promoterId: promoter.promoterId });
			expect(stored.name).toBe('Renamed Promoter');
		});

		it('throws NotFoundException for an unknown promoterId', async () => {
			const { program } = await createProgram(dataSource);

			await expect(
				service.updatePromoterInfo(program.programId, UNKNOWN_ID, {
					name: 'Ghost',
				}),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('updateRole', () => {
		it('refuses to let a member change their own role', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await expect(
				service.updateRole(member.memberId, member.memberId, {
					role: memberRoleEnum.EDITOR,
				}),
			).rejects.toThrow(BadRequestException);
		});

		it("updates another member's role within the same promoter", async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: admin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const otherMember = await createMember(dataSource, program);
			await dataSource.getRepository(PromoterMember).save({
				promoterId: promoter.promoterId,
				memberId: otherMember.memberId,
				role: memberRoleEnum.VIEWER,
				status: statusEnum.ACTIVE,
			});

			await service.updateRole(admin.memberId, otherMember.memberId, {
				role: memberRoleEnum.EDITOR,
			});

			const updated = await dataSource
				.getRepository(PromoterMember)
				.findOneByOrFail({
					promoterId: promoter.promoterId,
					memberId: otherMember.memberId,
				});
			expect(updated.role).toBe(memberRoleEnum.EDITOR);
		});
	});

	describe('removeMember', () => {
		it('marks a promoter member as inactive', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const otherMember = await createMember(dataSource, program);
			await dataSource.getRepository(PromoterMember).save({
				promoterId: promoter.promoterId,
				memberId: otherMember.memberId,
				role: memberRoleEnum.VIEWER,
				status: statusEnum.ACTIVE,
			});

			await service.removeMember(
				promoter.promoterId,
				otherMember.memberId,
			);

			const stored = await dataSource
				.getRepository(PromoterMember)
				.findOneByOrFail({
					promoterId: promoter.promoterId,
					memberId: otherMember.memberId,
				});
			expect(stored.status).toBe(statusEnum.INACTIVE);
		});
	});

	describe('deletePromoter', () => {
		it('refuses to delete a promoter that still has more than one member', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: admin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const otherMember = await createMember(dataSource, program);
			await dataSource.getRepository(PromoterMember).save({
				promoterId: promoter.promoterId,
				memberId: otherMember.memberId,
				role: memberRoleEnum.VIEWER,
				status: statusEnum.ACTIVE,
			});

			await expect(
				service.deletePromoter(
					admin.memberId,
					program.programId,
					promoter.promoterId,
				),
			).rejects.toThrow(BadRequestException);

			const stored = await dataSource
				.getRepository(Promoter)
				.findOneByOrFail({ promoterId: promoter.promoterId });
			expect(stored.status).toBe(promoterStatusEnum.ACTIVE);
		});

		it('archives the promoter and removes its sole admin', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: admin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await service.deletePromoter(
				admin.memberId,
				program.programId,
				promoter.promoterId,
			);

			const storedPromoter = await dataSource
				.getRepository(Promoter)
				.findOneByOrFail({ promoterId: promoter.promoterId });
			expect(storedPromoter.status).toBe(promoterStatusEnum.ARCHIVED);

			const storedMember = await dataSource
				.getRepository(Member)
				.findOneBy({ memberId: admin.memberId });
			expect(storedMember).toBeNull();
		});
	});

	describe('addMember', () => {
		it('invites a brand new email as an active promoter member', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const email = uniqueEmail('new-invite');

			await service.addMember(program.programId, promoter.promoterId, {
				email,
				password: 'password123',
				firstName: 'New',
				lastName: 'Member',
				role: memberRoleEnum.EDITOR,
			});

			const createdMember = await dataSource
				.getRepository(Member)
				.findOneByOrFail({ email });
			const promoterMember = await dataSource
				.getRepository(PromoterMember)
				.findOneByOrFail({
					promoterId: promoter.promoterId,
					memberId: createdMember.memberId,
				});
			expect(promoterMember.role).toBe(memberRoleEnum.EDITOR);
			expect(promoterMember.status).toBe(statusEnum.ACTIVE);
		});

		it('reactivates a member previously removed from this same promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const removedMember = await createMember(dataSource, program, {
				firstName: 'Old',
				lastName: 'Name',
				password: 'old-password',
			});
			await dataSource.getRepository(PromoterMember).save({
				promoterId: promoter.promoterId,
				memberId: removedMember.memberId,
				role: memberRoleEnum.VIEWER,
				status: statusEnum.INACTIVE,
			});

			await service.addMember(program.programId, promoter.promoterId, {
				email: removedMember.email,
				password: 'new-password-123',
				firstName: 'New',
				lastName: 'Name',
				role: memberRoleEnum.EDITOR,
			});

			const promoterMember = await dataSource
				.getRepository(PromoterMember)
				.findOneByOrFail({
					promoterId: promoter.promoterId,
					memberId: removedMember.memberId,
				});
			expect(promoterMember.status).toBe(statusEnum.ACTIVE);
			expect(promoterMember.role).toBe(memberRoleEnum.EDITOR);

			const updatedMember = await dataSource
				.getRepository(Member)
				.findOneByOrFail({ memberId: removedMember.memberId });
			expect(updatedMember.firstName).toBe('New');
			expect(updatedMember.lastName).toBe('Name');
			expect(
				await bcrypt.compare(
					'new-password-123',
					updatedMember.password,
				),
			).toBe(true);
		});
	});
});
