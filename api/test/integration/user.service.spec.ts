import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
	INestApplication,
	BadRequestException,
	ConflictException,
} from '@nestjs/common';
import { DataSource, EntityNotFoundError } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import {
	addUserToProgram,
	createProgram,
	createUser,
	uniqueEmail,
	unique,
} from '../support/factories';
import { UserService } from '../../src/services/user.service';
import { UserAuthService } from '../../src/services/userAuth.service';
import { ProgramUser, User } from '../../src/entities';
import { SignUpUserDto, UpdateUserDto } from '../../src/dtos';
import { statusEnum, userRoleEnum } from '../../src/enums';

const signUpDto = (overrides: Partial<SignUpUserDto> = {}): SignUpUserDto =>
	({
		email: uniqueEmail('signup'),
		password: 'password',
		firstName: 'Test',
		lastName: 'User',
		...overrides,
	}) as SignUpUserDto;

/**
 * Issue 42 in issues.md: getUsers's email search filters on the literal
 * string "undefined" when no email is given (`ILike(`%${email}%`)` with
 * `email` undefined becomes `'%undefined%'`). No test here encodes that as
 * correct; getUsers is only exercised with an explicit email filter.
 */
describe('UserService (integration)', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let service: UserService;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
		service = app.get(UserService);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	describe('userSignUp', () => {
		it('the first ever user becomes SUPER_ADMIN automatically, with the email lowercased and trimmed', async () => {
			// No seedSuperAdmin call here: this test relies on the isolated
			// transaction rolling back everything the other tests wrote, so the
			// user table is genuinely empty at this point.
			const raw = `  MixedCase-${unique('first')}@Test.LOCAL  `;

			const result = await service.userSignUp(signUpDto({ email: raw }));

			expect(result).toBeDefined();
			expect(result!.role).toBe(userRoleEnum.SUPER_ADMIN);
			expect(result!.email).toBe(raw.toLowerCase().trim());

			const stored = await dataSource
				.getRepository(User)
				.findOneByOrFail({ userId: result!.userId });
			expect(stored.email).toBe(raw.toLowerCase().trim());
		});

		it('throws ConflictException on a second attempt to sign up when a super admin already exists', async () => {
			await createUser(dataSource, { role: userRoleEnum.SUPER_ADMIN });

			await expect(
				service.userSignUp(signUpDto()),
			).rejects.toBeInstanceOf(ConflictException);
		});

		it('throws ConflictException when the email is already registered', async () => {
			// A regular user with no super admin present, so the email check is
			// reachable rather than being pre-empted by the super-admin-exists
			// check.
			await createUser(dataSource);
			const dto = signUpDto();

			await service.userSignUp(signUpDto({ email: dto.email }));

			await expect(
				service.userSignUp(signUpDto({ email: dto.email })),
			).rejects.toBeInstanceOf(ConflictException);
		});
	});

	describe('getUser / getUserEntity', () => {
		it('getUser throws EntityNotFoundError for an unknown user id', async () => {
			await expect(
				service.getUser('3f2504e0-4f89-11d3-9a0c-0305e82c3301'),
			).rejects.toBeInstanceOf(EntityNotFoundError);
		});

		it('getUserEntity throws EntityNotFoundError for an unknown user id', async () => {
			await expect(
				service.getUserEntity('3f2504e0-4f89-11d3-9a0c-0305e82c3301'),
			).rejects.toBeInstanceOf(EntityNotFoundError);
		});
	});

	describe('getUsers', () => {
		it('filters by an explicit email substring, case-insensitively', async () => {
			const target = await createUser(dataSource, {
				email: uniqueEmail('match-alpha'),
			});
			await createUser(dataSource, { email: uniqueEmail('other-beta') });

			const result = await service.getUsers('MATCH-ALPHA');

			const items = result.getItems() ?? [];
			expect(items).toHaveLength(1);
			expect(items[0].userId).toBe(target.userId);
		});

		it('paginates matches with skip and take', async () => {
			const prefix = unique('page');
			for (let i = 0; i < 3; i++) {
				await createUser(dataSource, {
					email: `${prefix}-${i}@test.local`,
				});
			}

			const page = await service.getUsers(prefix, 1, 1);

			expect(page.getItems()).toHaveLength(1);
			expect(page.getSkip()).toBe(1);
			expect(page.getTake()).toBe(1);
			expect(page.getCount()).toBe(3);
		});
	});

	describe('getUserByEmail', () => {
		it('returns null for an unknown email', async () => {
			expect(
				await service.getUserByEmail(uniqueEmail('missing')),
			).toBeNull();
		});

		it('returns the user with programUsers loaded for a known email', async () => {
			const user = await createUser(dataSource);
			const { program } = await createProgram(dataSource);
			await addUserToProgram(
				dataSource,
				user,
				program,
				userRoleEnum.VIEWER,
			);

			const result = await service.getUserByEmail(user.email);

			expect(result?.userId).toBe(user.userId);
			expect(result?.programUsers).toHaveLength(1);
			expect(result?.programUsers[0].programId).toBe(program.programId);
		});
	});

	describe('updateUserInfo', () => {
		it('throws BadRequestException when only one of currentPassword/newPassword is given', async () => {
			const user = await createUser(dataSource, { password: 'password' });

			await expect(
				service.updateUserInfo(user.userId, {
					newPassword: 'newpass123',
				} as UpdateUserDto),
			).rejects.toBeInstanceOf(BadRequestException);

			await expect(
				service.updateUserInfo(user.userId, {
					currentPassword: 'password',
				} as UpdateUserDto),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('throws BadRequestException when currentPassword is wrong', async () => {
			const user = await createUser(dataSource, { password: 'password' });

			await expect(
				service.updateUserInfo(user.userId, {
					currentPassword: 'wrong-password',
					newPassword: 'newpass123',
				} as UpdateUserDto),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('updates the password when both currentPassword and newPassword are correct', async () => {
			const user = await createUser(dataSource, { password: 'password' });

			await service.updateUserInfo(user.userId, {
				currentPassword: 'password',
				newPassword: 'newpass123',
			} as UpdateUserDto);

			const stored = await dataSource
				.getRepository(User)
				.findOneByOrFail({ userId: user.userId });
			const userAuthService = app.get(UserAuthService);
			expect(
				await userAuthService.comparePasswords(
					'newpass123',
					stored.password,
				),
			).toBe(true);
		});

		it('throws BadRequestException when renaming to an email already used by another user', async () => {
			const other = await createUser(dataSource, {
				email: uniqueEmail('taken'),
			});
			const user = await createUser(dataSource);

			await expect(
				service.updateUserInfo(user.userId, {
					email: other.email,
				} as UpdateUserDto),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('persists a plain field update', async () => {
			const user = await createUser(dataSource);

			await service.updateUserInfo(user.userId, {
				firstName: 'Updated',
			} as UpdateUserDto);

			const stored = await dataSource
				.getRepository(User)
				.findOneByOrFail({ userId: user.userId });
			expect(stored.firstName).toBe('Updated');
		});
	});

	describe('deleteUser', () => {
		it('throws a plain Error (not a Nest exception) for an unknown user id', async () => {
			const result = service.deleteUser(
				'3f2504e0-4f89-11d3-9a0c-0305e82c3301',
			);

			await expect(result).rejects.toBeInstanceOf(Error);
			await expect(result).rejects.not.toBeInstanceOf(
				BadRequestException,
			);
		});

		it('removes the row for a known user', async () => {
			const user = await createUser(dataSource);

			await service.deleteUser(user.userId);

			expect(
				await dataSource.getRepository(User).findOneBy({
					userId: user.userId,
				}),
			).toBeNull();
		});
	});

	describe('leaveProgram / canLeaveProgram', () => {
		it('a user who is one of several admins in a program can leave', async () => {
			const { program } = await createProgram(dataSource);
			const admin1 = await createUser(dataSource);
			const admin2 = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				admin1,
				program,
				userRoleEnum.ADMIN,
			);
			await addUserToProgram(
				dataSource,
				admin2,
				program,
				userRoleEnum.ADMIN,
			);

			await service.leaveProgram(admin1.userId, program.programId);

			const membership = await dataSource
				.getRepository(ProgramUser)
				.findOneByOrFail({
					programId: program.programId,
					userId: admin1.userId,
				});
			expect(membership.status).toBe(statusEnum.INACTIVE);
		});

		it('the sole admin can leave when a super admin also exists in the program', async () => {
			// createProgram (via ProgramSubscriber.afterInsert) already attaches
			// the platform super admin to this program.
			const { program } = await createProgram(dataSource);
			const admin = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				admin,
				program,
				userRoleEnum.ADMIN,
			);

			await service.leaveProgram(admin.userId, program.programId);

			const membership = await dataSource
				.getRepository(ProgramUser)
				.findOneByOrFail({
					programId: program.programId,
					userId: admin.userId,
				});
			expect(membership.status).toBe(statusEnum.INACTIVE);
		});

		it('the sole admin cannot leave when no super admin exists in the program', async () => {
			const { program } = await createProgram(dataSource);
			// Remove the ProgramSubscriber-attached super admin membership so this
			// program genuinely has none, to reach the "no super admin" branch of
			// canLeaveProgram.
			await dataSource.getRepository(ProgramUser).delete({
				programId: program.programId,
				role: userRoleEnum.SUPER_ADMIN,
			});

			const admin = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				admin,
				program,
				userRoleEnum.ADMIN,
			);

			await expect(
				service.leaveProgram(admin.userId, program.programId),
			).rejects.toBeInstanceOf(BadRequestException);

			const membership = await dataSource
				.getRepository(ProgramUser)
				.findOneByOrFail({
					programId: program.programId,
					userId: admin.userId,
				});
			expect(membership.status).toBe(statusEnum.ACTIVE);
		});

		it('a non-admin leaving does not trigger the admin-count check, even without a super admin', async () => {
			const { program } = await createProgram(dataSource);
			await dataSource.getRepository(ProgramUser).delete({
				programId: program.programId,
				role: userRoleEnum.SUPER_ADMIN,
			});

			const admin = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				admin,
				program,
				userRoleEnum.ADMIN,
			);
			const viewer = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				viewer,
				program,
				userRoleEnum.VIEWER,
			);

			await service.leaveProgram(viewer.userId, program.programId);

			const membership = await dataSource
				.getRepository(ProgramUser)
				.findOneByOrFail({
					programId: program.programId,
					userId: viewer.userId,
				});
			expect(membership.status).toBe(statusEnum.INACTIVE);
		});
	});
});
