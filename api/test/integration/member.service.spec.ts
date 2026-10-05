import { randomUUID } from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
	BadRequestException,
	INestApplication,
	NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import {
	createMember,
	createProgram,
	createPromoter,
	uniqueEmail,
} from '../support/factories';
import { MemberService } from '../../src/services/member.service';
import { MemberAuthService } from '../../src/services/memberAuth.service';
import {
	Member,
	Promoter,
	ProgramPromoter,
	PromoterMember,
} from '../../src/entities';
import { SignUpMemberDto, UpdateMemberDto } from '../../src/dtos';
import {
	memberRoleEnum,
	promoterStatusEnum,
	statusEnum,
} from '../../src/enums';

/**
 * MemberService covers member sign up/auth, profile updates and the
 * admin-deletion cascade that can archive a promoter as a side effect.
 */
describe('MemberService', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let service: MemberService;
	let memberAuthService: MemberAuthService;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
		service = app.get(MemberService);
		memberAuthService = app.get(MemberAuthService);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	function signUpDto(
		overrides: Partial<SignUpMemberDto> = {},
	): SignUpMemberDto {
		return {
			email: uniqueEmail('signup'),
			password: 'password123',
			firstName: 'Signup',
			lastName: 'Member',
			...overrides,
		} as SignUpMemberDto;
	}

	describe('memberSignUp', () => {
		it('throws BadRequestException when the email already belongs to an active member of an active promoter in the program', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const email = uniqueEmail('taken');
			const existingMember = await createMember(dataSource, program, {
				email,
			});
			await createPromoter(dataSource, program, defaultCircle, {
				member: existingMember,
			});

			await expect(
				service.memberSignUp(program.programId, signUpDto({ email })),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('succeeds when the same email is used to sign up in a different program', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const email = uniqueEmail('taken');
			const existingMember = await createMember(dataSource, program, {
				email,
			});
			await createPromoter(dataSource, program, defaultCircle, {
				member: existingMember,
			});

			const { program: otherProgram } = await createProgram(dataSource);

			await expect(
				service.memberSignUp(
					otherProgram.programId,
					signUpDto({ email }),
				),
			).resolves.toBeDefined();
		});

		it('lowercases and trims the email before storing it, and returns an auth result', async () => {
			const { program } = await createProgram(dataSource);

			const authResult = await service.memberSignUp(
				program.programId,
				signUpDto({ email: '  Padded.Email@Example.COM  ' }),
			);

			expect(authResult).toBeTruthy();

			const stored = await dataSource
				.getRepository(Member)
				.findOneOrFail({
					where: { program: { programId: program.programId } },
				});
			expect(stored.email).toBe('padded.email@example.com');
		});
	});

	describe('memberExistsInProgram', () => {
		it('returns false when the matching promoterMember row is INACTIVE', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const email = uniqueEmail('inactive-membership');
			const member = await createMember(dataSource, program, { email });
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
				{
					member,
				},
			);

			await dataSource.getRepository(PromoterMember).update(
				{
					promoterId: promoter.promoterId,
					memberId: member.memberId,
				},
				{ status: statusEnum.INACTIVE },
			);

			await expect(
				service.memberExistsInProgram(email, program.programId),
			).resolves.toBe(false);
		});

		it('returns false when the matching promoter is ARCHIVED', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const email = uniqueEmail('archived-promoter');
			const member = await createMember(dataSource, program, { email });
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
				{
					member,
				},
			);

			await dataSource
				.getRepository(Promoter)
				.update(
					{ promoterId: promoter.promoterId },
					{ status: promoterStatusEnum.ARCHIVED },
				);

			await expect(
				service.memberExistsInProgram(email, program.programId),
			).resolves.toBe(false);
		});
	});

	describe('getMember / getMemberEntity', () => {
		it('getMember throws NotFoundException for an unknown memberId', async () => {
			await expect(
				service.getMember(randomUUID()),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('getMemberEntity throws NotFoundException for an unknown memberId', async () => {
			await expect(
				service.getMemberEntity(randomUUID()),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe('updateMemberInfo', () => {
		it('rejects when only one of currentPassword/newPassword is given', async () => {
			const { program } = await createProgram(dataSource);
			const member = await createMember(dataSource, program, {
				password: 'password123',
			});

			await expect(
				service.updateMemberInfo(member.memberId, {
					currentPassword: 'password123',
				} as UpdateMemberDto),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('rejects when currentPassword is wrong', async () => {
			const { program } = await createProgram(dataSource);
			const member = await createMember(dataSource, program, {
				password: 'password123',
			});

			await expect(
				service.updateMemberInfo(member.memberId, {
					currentPassword: 'not-the-password',
					newPassword: 'newpassword456',
				} as UpdateMemberDto),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('changes the password when currentPassword and newPassword are both correct', async () => {
			const { program } = await createProgram(dataSource);
			const member = await createMember(dataSource, program, {
				password: 'password123',
			});

			await service.updateMemberInfo(member.memberId, {
				currentPassword: 'password123',
				newPassword: 'newpassword456',
			} as UpdateMemberDto);

			const updated = await dataSource
				.getRepository(Member)
				.findOneByOrFail({ memberId: member.memberId });

			await expect(
				memberAuthService.comparePasswords(
					'newpassword456',
					updated.password,
				),
			).resolves.toBe(true);
			await expect(
				memberAuthService.comparePasswords(
					'password123',
					updated.password,
				),
			).resolves.toBe(false);
		});

		it('rejects renaming to an email already active in the same program', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const takenEmail = uniqueEmail('taken');
			const activeMember = await createMember(dataSource, program, {
				email: takenEmail,
			});
			await createPromoter(dataSource, program, defaultCircle, {
				member: activeMember,
			});
			const member = await createMember(dataSource, program);

			await expect(
				service.updateMemberInfo(member.memberId, {
					email: takenEmail,
				} as UpdateMemberDto),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('allows renaming to an email used by an active member of a different program', async () => {
			const { program: programA, defaultCircle: circleA } =
				await createProgram(dataSource);
			const sharedEmail = uniqueEmail('cross-program');
			const activeMember = await createMember(dataSource, programA, {
				email: sharedEmail,
			});
			await createPromoter(dataSource, programA, circleA, {
				member: activeMember,
			});

			const { program: programB } = await createProgram(dataSource);
			const member = await createMember(dataSource, programB);

			await expect(
				service.updateMemberInfo(member.memberId, {
					email: sharedEmail,
				} as UpdateMemberDto),
			).resolves.toBeDefined();
		});

		it('persists a plain field update', async () => {
			const { program } = await createProgram(dataSource);
			const member = await createMember(dataSource, program, {
				firstName: 'Original',
			});

			await service.updateMemberInfo(member.memberId, {
				firstName: 'Updated',
			} as UpdateMemberDto);

			const updated = await dataSource
				.getRepository(Member)
				.findOneByOrFail({ memberId: member.memberId });
			expect(updated.firstName).toBe('Updated');
		});
	});

	describe('deleteMember', () => {
		it('removes a non-admin member without complaint', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: admin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const viewer = await createMember(dataSource, program);
			await dataSource.getRepository(PromoterMember).save({
				promoterId: promoter.promoterId,
				memberId: viewer.memberId,
				role: memberRoleEnum.VIEWER,
				status: statusEnum.ACTIVE,
			});

			await service.deleteMember(viewer.memberId);

			const stored = await dataSource
				.getRepository(Member)
				.findOneBy({ memberId: viewer.memberId });
			expect(stored).toBeNull();

			// The admin and the promoter are unaffected.
			const promoterAfter = await dataSource
				.getRepository(Promoter)
				.findOneByOrFail({ promoterId: promoter.promoterId });
			expect(promoterAfter.status).toBe(promoterStatusEnum.ACTIVE);
			expect(
				await dataSource
					.getRepository(Member)
					.findOneBy({ memberId: admin.memberId }),
			).not.toBeNull();
		});

		it('removes an admin who is one of several admins, leaving the promoter untouched', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: firstAdmin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const secondAdmin = await createMember(dataSource, program);
			await dataSource.getRepository(PromoterMember).save({
				promoterId: promoter.promoterId,
				memberId: secondAdmin.memberId,
				role: memberRoleEnum.ADMIN,
				status: statusEnum.ACTIVE,
			});

			await service.deleteMember(secondAdmin.memberId);

			expect(
				await dataSource
					.getRepository(Member)
					.findOneBy({ memberId: secondAdmin.memberId }),
			).toBeNull();

			const promoterAfter = await dataSource
				.getRepository(Promoter)
				.findOneByOrFail({ promoterId: promoter.promoterId });
			expect(promoterAfter.status).toBe(promoterStatusEnum.ACTIVE);
			expect(
				await dataSource
					.getRepository(Member)
					.findOneBy({ memberId: firstAdmin.memberId }),
			).not.toBeNull();
		});

		it('removes the sole admin of a promoter that has only that member, and archives the promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await service.deleteMember(member.memberId);

			expect(
				await dataSource
					.getRepository(Member)
					.findOneBy({ memberId: member.memberId }),
			).toBeNull();

			const promoterAfter = await dataSource
				.getRepository(Promoter)
				.findOneByOrFail({ promoterId: promoter.promoterId });
			expect(promoterAfter.status).toBe(promoterStatusEnum.ARCHIVED);
		});

		// Issue 30 in issues.md: the only admin of a promoter that still has
		// other (non-admin) members calls delete and gets a silent no-op —
		// `canDelete` ends up false and `deleteMember` never throws, it simply
		// skips the removal. This only asserts the observable, current
		// behavior (the admin's row survives); it does not encode the no-op as
		// correct.
		it('does not remove the sole admin while the promoter still has other members', async () => {
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

			await service.deleteMember(admin.memberId);

			const stillPresent = await dataSource
				.getRepository(Member)
				.findOneBy({ memberId: admin.memberId });
			expect(stillPresent).not.toBeNull();
		});
	});

	describe('getPromoterOfMember', () => {
		it('throws NotFoundException when the member has no promoterMember row', async () => {
			const { program } = await createProgram(dataSource);
			const member = await createMember(dataSource, program);

			await expect(
				service.getPromoterOfMember(program.programId, member.memberId),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it("throws NotFoundException when the member's promoter is ARCHIVED", async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			await dataSource
				.getRepository(Promoter)
				.update(
					{ promoterId: promoter.promoterId },
					{ status: promoterStatusEnum.ARCHIVED },
				);

			await expect(
				service.getPromoterOfMember(program.programId, member.memberId),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it("sources acceptedTermsAndConditions from this program's own ProgramPromoter row", async () => {
			const { program: programA, defaultCircle: circleA } =
				await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				programA,
				circleA,
			);

			const { program: programB } = await createProgram(dataSource);
			await dataSource.getRepository(ProgramPromoter).save({
				programId: programB.programId,
				promoterId: promoter.promoterId,
				acceptedTermsAndConditions: false,
			});

			const promoterFromA = await service.getPromoterOfMember(
				programA.programId,
				member.memberId,
			);
			expect(promoterFromA.acceptedTermsAndConditions).toBe(true);

			const promoterFromB = await service.getPromoterOfMember(
				programB.programId,
				member.memberId,
			);
			expect(promoterFromB.acceptedTermsAndConditions).toBe(false);
		});
	});
});
