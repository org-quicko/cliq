import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
	INestApplication,
	ConflictException,
	NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import {
	addUserToProgram,
	createProgram,
	createUser,
	seedSuperAdmin,
	unique,
	uniqueEmail,
} from '../support/factories';
import { Circle, Program, ProgramUser, User } from '../../src/entities';
import { ProgramService } from '../../src/services/program.service';
import {
	referralKeyTypeEnum,
	statusEnum,
	userRoleEnum,
	visibilityEnum,
} from '../../src/enums';
import {
	CreateProgramDto,
	CreateUserDto,
	UpdateProgramDto,
	UpdateProgramUserDto,
} from '../../src/dtos';

const UNKNOWN_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

const buildCreateProgramDto = (
	overrides: Partial<CreateProgramDto> = {},
): CreateProgramDto =>
	({
		name: unique('Program'),
		website: 'https://example.com',
		visibility: visibilityEnum.PUBLIC,
		currency: 'USD',
		referralKeyType: referralKeyTypeEnum.EMAIL,
		timeZone: 'UTC',
		...overrides,
	}) as CreateProgramDto;

/**
 * Real, currently-correct ProgramService behavior not already exercised by
 * where-filters.spec.ts (ProgramService.getAllPrograms) or
 * program-subscriber.spec.ts (super admin auto-attach / membership cleanup on
 * program removal). Cases that hit a documented bug in issues.md were left
 * out, per that file's convention.
 */
describe('ProgramService', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let service: ProgramService;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
		service = app.get(ProgramService);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	describe('createProgram', () => {
		it('creates the program with the given fields plus its DEFAULT_CIRCLE, and makes the caller super admin', async () => {
			await seedSuperAdmin(dataSource);
			const caller = await createUser(dataSource);

			const dto = buildCreateProgramDto({
				name: 'Referral HQ',
				website: 'https://referral-hq.example.com',
				visibility: visibilityEnum.PRIVATE,
				currency: 'INR',
				referralKeyType: referralKeyTypeEnum.PHONE,
				timeZone: 'Asia/Kolkata',
			});

			const result = await service.createProgram(caller.userId, dto);

			expect(result).toMatchObject({
				name: 'Referral HQ',
				website: 'https://referral-hq.example.com',
				visibility: visibilityEnum.PRIVATE,
				currency: 'INR',
				referralKeyType: referralKeyTypeEnum.PHONE,
				timeZone: 'Asia/Kolkata',
			});

			const circle = await dataSource.getRepository(Circle).findOneBy({
				programId: result.programId,
				isDefaultCircle: true,
			});
			expect(circle).toMatchObject({ name: 'DEFAULT_CIRCLE' });

			const membership = await dataSource
				.getRepository(ProgramUser)
				.findOneBy({
					programId: result.programId,
					userId: caller.userId,
				});
			expect(membership?.role).toBe(userRoleEnum.SUPER_ADMIN);
		});
	});

	describe('getProgramEntity', () => {
		it('throws NotFoundException for an unknown program id', async () => {
			await expect(
				service.getProgramEntity(UNKNOWN_ID),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('applies extra whereOptions as additional scoping, not just an id lookup', async () => {
			const { program } = await createProgram(dataSource, {
				visibility: visibilityEnum.PUBLIC,
			});

			await expect(
				service.getProgramEntity(program.programId, {
					visibility: visibilityEnum.PRIVATE,
				}),
			).rejects.toBeInstanceOf(NotFoundException);

			await expect(
				service.getProgramEntity(program.programId, {
					visibility: visibilityEnum.PUBLIC,
				}),
			).resolves.toMatchObject({ programId: program.programId });
		});
	});

	describe('isProgramPublic', () => {
		it('reflects the program visibility, and throws for an unknown id', async () => {
			const { program: pub } = await createProgram(dataSource, {
				visibility: visibilityEnum.PUBLIC,
			});
			const { program: priv } = await createProgram(dataSource, {
				visibility: visibilityEnum.PRIVATE,
			});

			await expect(service.isProgramPublic(pub.programId)).resolves.toBe(
				true,
			);
			await expect(service.isProgramPublic(priv.programId)).resolves.toBe(
				false,
			);
			await expect(
				service.isProgramPublic(UNKNOWN_ID),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe('updateProgram', () => {
		it('throws NotFoundException for an unknown program id', async () => {
			await expect(
				service.updateProgram(UNKNOWN_ID, {
					name: 'x',
				} as UpdateProgramDto),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('persists a real field update', async () => {
			const { program } = await createProgram(dataSource, {
				name: 'Old Name',
			});

			await service.updateProgram(program.programId, {
				name: 'New Name',
			} as UpdateProgramDto);

			const updated = await dataSource
				.getRepository(Program)
				.findOneByOrFail({ programId: program.programId });
			expect(updated.name).toBe('New Name');
		});
	});

	describe('deleteProgram', () => {
		it('throws NotFoundException for an unknown program id', async () => {
			await expect(
				service.deleteProgram(UNKNOWN_ID),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('deletes the program row', async () => {
			const { program } = await createProgram(dataSource);

			await service.deleteProgram(program.programId);

			const found = await dataSource
				.getRepository(Program)
				.findOneBy({ programId: program.programId });
			expect(found).toBeNull();
		});
	});

	describe('addUser (invite flow)', () => {
		it('invites a brand new email: creates the User row and a ProgramUser row with the given role', async () => {
			const { program } = await createProgram(dataSource);
			const email = uniqueEmail('brand-new');

			await service.addUser(program.programId, {
				email,
				password: 'password',
				firstName: 'Brand',
				lastName: 'New',
				role: userRoleEnum.EDITOR,
			} as CreateUserDto);

			const user = await dataSource
				.getRepository(User)
				.findOneByOrFail({ email });
			expect(user).toMatchObject({ firstName: 'Brand', lastName: 'New' });

			const membership = await dataSource
				.getRepository(ProgramUser)
				.findOneByOrFail({
					programId: program.programId,
					userId: user.userId,
				});
			expect(membership).toMatchObject({
				role: userRoleEnum.EDITOR,
				status: statusEnum.ACTIVE,
			});
		});

		it('invites an email that already has an account elsewhere: adds a ProgramUser row without creating a second User row', async () => {
			const { program } = await createProgram(dataSource);
			const existing = await createUser(dataSource);

			await service.addUser(program.programId, {
				email: existing.email,
				role: userRoleEnum.VIEWER,
			} as CreateUserDto);

			const usersWithEmail = await dataSource
				.getRepository(User)
				.countBy({ email: existing.email });
			expect(usersWithEmail).toBe(1);

			const membership = await dataSource
				.getRepository(ProgramUser)
				.findOneByOrFail({
					programId: program.programId,
					userId: existing.userId,
				});
			expect(membership.role).toBe(userRoleEnum.VIEWER);
		});

		it('rejects inviting an email that already has an active membership in the same program', async () => {
			const { program } = await createProgram(dataSource);
			const user = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				user,
				program,
				userRoleEnum.VIEWER,
			);

			await expect(
				service.addUser(program.programId, {
					email: user.email,
					role: userRoleEnum.ADMIN,
				} as CreateUserDto),
			).rejects.toBeInstanceOf(ConflictException);
		});

		it('re-inviting a previously removed (inactive) member reactivates that same row instead of duplicating it', async () => {
			const { program } = await createProgram(dataSource);
			const user = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				user,
				program,
				userRoleEnum.VIEWER,
				statusEnum.INACTIVE,
			);

			await service.addUser(program.programId, {
				email: user.email,
				role: userRoleEnum.ADMIN,
			} as CreateUserDto);

			const memberships = await dataSource
				.getRepository(ProgramUser)
				.find({
					where: {
						programId: program.programId,
						userId: user.userId,
					},
				});
			expect(memberships).toHaveLength(1);
			expect(memberships[0]).toMatchObject({
				status: statusEnum.ACTIVE,
				role: userRoleEnum.ADMIN,
			});
		});
	});

	describe('updateRole', () => {
		it('persists a real role change', async () => {
			const { program } = await createProgram(dataSource);
			const user = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				user,
				program,
				userRoleEnum.VIEWER,
			);

			await service.updateRole(program.programId, user.userId, {
				role: userRoleEnum.ADMIN,
			} as UpdateProgramUserDto);

			const membership = await dataSource
				.getRepository(ProgramUser)
				.findOneByOrFail({
					programId: program.programId,
					userId: user.userId,
				});
			expect(membership.role).toBe(userRoleEnum.ADMIN);
		});

		it('throws NotFoundException for a membership that does not exist', async () => {
			const { program } = await createProgram(dataSource);
			const user = await createUser(dataSource);

			await expect(
				service.updateRole(program.programId, user.userId, {
					role: userRoleEnum.ADMIN,
				} as UpdateProgramUserDto),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe('removeUser', () => {
		it('deactivates an active membership', async () => {
			const { program } = await createProgram(dataSource);
			const user = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				user,
				program,
				userRoleEnum.VIEWER,
			);

			await service.removeUser(program.programId, user.userId);

			const membership = await dataSource
				.getRepository(ProgramUser)
				.findOneByOrFail({
					programId: program.programId,
					userId: user.userId,
				});
			expect(membership.status).toBe(statusEnum.INACTIVE);
		});

		it('throws NotFoundException for a user who was never a member of the program', async () => {
			const { program } = await createProgram(dataSource);
			const user = await createUser(dataSource);

			await expect(
				service.removeUser(program.programId, user.userId),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe('getProgramUserRowEntity', () => {
		it('returns the active membership row', async () => {
			const { program } = await createProgram(dataSource);
			const user = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				user,
				program,
				userRoleEnum.ADMIN,
			);

			const row = await service.getProgramUserRowEntity(
				program.programId,
				user.userId,
			);
			expect(row).toMatchObject({
				role: userRoleEnum.ADMIN,
				status: statusEnum.ACTIVE,
			});
		});

		it('throws NotFoundException when the membership exists but is inactive', async () => {
			const { program } = await createProgram(dataSource);
			const user = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				user,
				program,
				userRoleEnum.ADMIN,
				statusEnum.INACTIVE,
			);

			await expect(
				service.getProgramUserRowEntity(program.programId, user.userId),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe('getProgramSummary', () => {
		async function refreshSummaryView() {
			await dataSource.query(
				'REFRESH MATERIALIZED VIEW program_summary_mv WITH DATA;',
			);
		}

		it('scopes to a single program when program_id is given', async () => {
			const { program: kept } = await createProgram(dataSource, {
				name: unique('Kept Program'),
			});
			const { program: other } = await createProgram(dataSource, {
				name: unique('Other Program'),
			});
			await refreshSummaryView();

			const result = await service.getProgramSummary(
				'irrelevant-caller-id',
				kept.programId,
			);

			const body = JSON.stringify(result);
			expect(body).toContain(kept.name);
			expect(body).not.toContain(other.name);
		});

		it('narrows by a case-insensitive partial name match', async () => {
			const distinctive = unique('Zephyr');
			const { program: matching } = await createProgram(dataSource, {
				name: `${distinctive} Rewards`,
			});
			const { program: other } = await createProgram(dataSource, {
				name: unique('Unrelated Program'),
			});
			await refreshSummaryView();

			const result = await service.getProgramSummary(
				'irrelevant-caller-id',
				undefined,
				distinctive.toLowerCase(),
			);

			const body = JSON.stringify(result);
			expect(body).toContain(matching.name);
			expect(body).not.toContain(other.name);
		});
	});
});
