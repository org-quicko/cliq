import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import { asUser } from '../support/auth';
import {
	addUserToProgram,
	createProgram,
	createUser,
	seedSuperAdmin,
	uniqueEmail,
} from '../support/factories';
import { Program, ProgramUser, User } from '../../src/entities';
import { statusEnum, userRoleEnum } from '../../src/enums';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

/**
 * Program membership (list, invite, change role, remove, leave) and the
 * /users/:id resource.
 *
 * Each test gets a fresh program with one user per program role plus an
 * `outsider` who is an admin, but of a different program. The outsider is the
 * tenant-isolation probe: holding a powerful role somewhere must not reach
 * into a program the user does not belong to.
 */
describe('program users (e2e)', () => {
	let app: INestApplication<App>;
	let dataSource: DataSource;

	beforeAll(async () => {
		app = await createTestApp({ http: true });
		dataSource = app.get(DataSource);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	let superAdmin: User;
	let program: Program;
	let otherProgram: Program;
	let admin: User;
	let editor: User;
	let viewer: User;
	let outsider: User;

	async function userWithRole(
		target: Program,
		role: userRoleEnum,
		status = statusEnum.ACTIVE,
	) {
		const user = await createUser(dataSource);
		await addUserToProgram(dataSource, user, target, role, status);
		return user;
	}

	const membership = (user: User, target: Program = program) =>
		dataSource.getRepository(ProgramUser).findOneBy({
			userId: user.userId,
			programId: target.programId,
		});

	beforeEach(async () => {
		superAdmin = await seedSuperAdmin(dataSource);
		({ program } = await createProgram(dataSource));
		({ program: otherProgram } = await createProgram(dataSource));
		admin = await userWithRole(program, userRoleEnum.ADMIN);
		editor = await userWithRole(program, userRoleEnum.EDITOR);
		viewer = await userWithRole(program, userRoleEnum.VIEWER);
		outsider = await userWithRole(otherProgram, userRoleEnum.ADMIN);
	});

	/**
	 * Every active member may read the member list (`read` ProgramUser);
	 * the service returns only active memberships.
	 */
	describe('GET /programs/:program_id/users', () => {
		it('lists active members with their program role', async () => {
			const removed = await userWithRole(
				program,
				userRoleEnum.EDITOR,
				statusEnum.INACTIVE,
			);

			const response = await request(app.getHttpServer())
				.get(`/api/programs/${program.programId}/users`)
				.set(...asUser(app, viewer))
				.expect(200);

			const rows = response.body.data as {
				user_id: string;
				role: string;
				status: string;
				email: string;
			}[];
			const byId = Object.fromEntries(
				rows.map((row) => [row.user_id, row]),
			);
			expect(Object.keys(byId).sort()).toEqual(
				[
					superAdmin.userId,
					admin.userId,
					editor.userId,
					viewer.userId,
				].sort(),
			);
			expect(byId[admin.userId]).toMatchObject({
				role: 'admin',
				status: 'active',
				email: admin.email,
			});
			expect(byId[superAdmin.userId].role).toBe('super_admin');
			expect(byId[removed.userId]).toBeUndefined();
			expect(byId[outsider.userId]).toBeUndefined();
			expect(rows.every((row) => !('password' in row))).toBe(true);
		});

		it('filters by role', async () => {
			const response = await request(app.getHttpServer())
				.get(`/api/programs/${program.programId}/users`)
				.query({ role: 'editor' })
				.set(...asUser(app, admin))
				.expect(200);

			expect(
				response.body.data.map(
					(row: { user_id: string }) => row.user_id,
				),
			).toEqual([editor.userId]);
		});

		it('pages with skip and take', async () => {
			const response = await request(app.getHttpServer())
				.get(`/api/programs/${program.programId}/users`)
				.query({ skip: 1, take: 2 })
				.set(...asUser(app, admin))
				.expect(200);

			expect(response.body.data).toHaveLength(2);
		});

		it('403s for the admin of a different program', async () => {
			await request(app.getHttpServer())
				.get(`/api/programs/${program.programId}/users`)
				.set(...asUser(app, outsider))
				.expect(403);
		});

		it('403s for a user who was removed and belongs nowhere else', async () => {
			const removed = await userWithRole(
				program,
				userRoleEnum.ADMIN,
				statusEnum.INACTIVE,
			);

			await request(app.getHttpServer())
				.get(`/api/programs/${program.programId}/users`)
				.set(...asUser(app, removed))
				.expect(403);
		});
	});

	/**
	 * `invite_user` Program belongs to program admins / super_admins. An
	 * unknown email gets an account; a known one gets a membership; a
	 * previously removed member is reactivated.
	 */
	describe('POST /programs/:program_id/invite', () => {
		const invite = (
			actor: User,
			body: Record<string, unknown>,
			target: Program = program,
		) =>
			request(app.getHttpServer())
				.post(`/api/programs/${target.programId}/invite`)
				.set(...asUser(app, actor))
				.send(body);

		it('creates an account for a new email and adds it with the requested role', async () => {
			const email = uniqueEmail('invitee');

			await invite(admin, {
				email,
				password: 'invitee-pass',
				first_name: 'In',
				last_name: 'Vitee',
				role: 'editor',
			}).expect(201);

			const created = await dataSource
				.getRepository(User)
				.findOneByOrFail({ email });
			expect(created).toMatchObject({
				firstName: 'In',
				lastName: 'Vitee',
				role: userRoleEnum.REGULAR,
			});
			expect(created.password).not.toBe('invitee-pass');
			expect(await membership(created)).toMatchObject({
				role: userRoleEnum.EDITOR,
				status: statusEnum.ACTIVE,
			});

			// The invitee can log in with the password chosen at invite time.
			await request(app.getHttpServer())
				.post('/api/users/login')
				.send({ email, password: 'invitee-pass' })
				.expect(201);
		});

		it('defaults the role to viewer', async () => {
			const email = uniqueEmail('invitee');

			await invite(admin, {
				email,
				password: 'pw',
				first_name: 'A',
				last_name: 'B',
			}).expect(201);

			const created = await dataSource
				.getRepository(User)
				.findOneByOrFail({ email });
			expect((await membership(created))?.role).toBe(userRoleEnum.VIEWER);
		});

		it('adds an existing user without creating a second account', async () => {
			await invite(admin, { email: outsider.email }).expect(201);

			expect(
				await dataSource
					.getRepository(User)
					.countBy({ email: outsider.email }),
			).toBe(1);
			expect(await membership(outsider)).toMatchObject({
				role: userRoleEnum.VIEWER,
				status: statusEnum.ACTIVE,
			});
			// Their membership elsewhere is untouched.
			expect((await membership(outsider, otherProgram))?.role).toBe(
				userRoleEnum.ADMIN,
			);
		});

		it('reactivates a removed member with the new role', async () => {
			const removed = await userWithRole(
				program,
				userRoleEnum.ADMIN,
				statusEnum.INACTIVE,
			);

			await invite(admin, {
				email: removed.email,
				role: 'viewer',
			}).expect(201);

			expect(await membership(removed)).toMatchObject({
				role: userRoleEnum.VIEWER,
				status: statusEnum.ACTIVE,
			});
		});

		it('409s for a user who is already an active member', async () => {
			await invite(admin, { email: editor.email, role: 'admin' }).expect(
				409,
			);

			expect((await membership(editor))?.role).toBe(userRoleEnum.EDITOR);
		});

		it('lets the platform super admin invite', async () => {
			await invite(superAdmin, {
				email: outsider.email,
				role: 'editor',
			}).expect(201);

			expect((await membership(outsider))?.role).toBe(
				userRoleEnum.EDITOR,
			);
		});

		it.each([
			['editor', () => editor],
			['viewer', () => viewer],
			['admin of a different program', () => outsider],
		])('403s for a program %s', async (_label, actor) => {
			const email = uniqueEmail('invitee');

			await invite(actor(), {
				email,
				password: 'pw',
				first_name: 'A',
				last_name: 'B',
			}).expect(403);

			expect(
				await dataSource.getRepository(User).existsBy({ email }),
			).toBe(false);
		});

		it.each([
			['an invalid email', { email: 'not-an-email' }],
			['a missing email', { first_name: 'A' }],
			['an unknown role', { email: 'x@test.local', role: 'owner' }],
			[
				'an undeclared property',
				{ email: 'x@test.local', status: 'active' },
			],
		])('400s on %s', async (_label, body) => {
			await invite(admin, body).expect(400);

			expect(
				await dataSource
					.getRepository(User)
					.existsBy({ email: 'x@test.local' }),
			).toBe(false);
		});
	});

	/**
	 * `change_role` ProgramUser is an admin capability; editors and viewers
	 * must be refused, as must admins of other programs.
	 */
	describe('PATCH /programs/:program_id/users/:user_id', () => {
		const changeRole = (
			actor: User,
			target: User,
			body: Record<string, unknown>,
		) =>
			request(app.getHttpServer())
				.patch(
					`/api/programs/${program.programId}/users/${target.userId}`,
				)
				.set(...asUser(app, actor))
				.send(body);

		it("lets a program admin change another member's role", async () => {
			await changeRole(admin, viewer, { role: 'editor' }).expect(200);

			expect((await membership(viewer))?.role).toBe(userRoleEnum.EDITOR);
		});

		it('lets the platform super admin change a role', async () => {
			await changeRole(superAdmin, admin, { role: 'viewer' }).expect(200);

			expect((await membership(admin))?.role).toBe(userRoleEnum.VIEWER);
		});

		it.each([
			['editor', () => editor],
			['viewer', () => viewer],
		])('403s for a program %s', async (_label, actor) => {
			await changeRole(actor(), admin, { role: 'viewer' }).expect(403);

			expect((await membership(admin))?.role).toBe(userRoleEnum.ADMIN);
		});

		it('403s for the admin of a different program', async () => {
			await changeRole(outsider, viewer, { role: 'admin' }).expect(403);

			expect((await membership(viewer))?.role).toBe(userRoleEnum.VIEWER);
		});

		it('404s for a user who is not in the program', async () => {
			const stranger = await createUser(dataSource);

			await changeRole(admin, stranger, { role: 'viewer' }).expect(404);

			expect(await membership(stranger)).toBeNull();
		});

		it('400s on an unknown role', async () => {
			await changeRole(admin, viewer, { role: 'owner' }).expect(400);

			expect((await membership(viewer))?.role).toBe(userRoleEnum.VIEWER);
		});

		it('rejects an undeclared property', async () => {
			await changeRole(admin, viewer, {
				role: 'editor',
				user_id: admin.userId,
			}).expect(400);

			expect((await membership(viewer))?.role).toBe(userRoleEnum.VIEWER);
		});
	});

	/**
	 * Removal is a soft delete (status → inactive) behind `remove_user`
	 * ProgramUser.
	 */
	describe('DELETE /programs/:program_id/users/:user_id', () => {
		const removeUser = (actor: User, target: User) =>
			request(app.getHttpServer())
				.delete(
					`/api/programs/${program.programId}/users/${target.userId}`,
				)
				.set(...asUser(app, actor));

		it('deactivates the membership, which drops the program from their access', async () => {
			await removeUser(admin, editor).expect(200);

			expect(await membership(editor)).toMatchObject({
				status: statusEnum.INACTIVE,
				role: userRoleEnum.EDITOR,
			});

			const programs = await request(app.getHttpServer())
				.get('/api/programs')
				.set(...asUser(app, editor))
				.expect(200);
			expect(programs.body.data).toEqual([]);

			await request(app.getHttpServer())
				.get(`/api/programs/${program.programId}/users`)
				.set(...asUser(app, editor))
				.expect(403);
		});

		it.each([
			['editor', () => editor],
			['viewer', () => viewer],
		])('403s for a program %s', async (_label, actor) => {
			await removeUser(actor(), admin).expect(403);

			expect((await membership(admin))?.status).toBe(statusEnum.ACTIVE);
		});

		it('403s for the admin of a different program', async () => {
			await removeUser(outsider, viewer).expect(403);

			expect((await membership(viewer))?.status).toBe(statusEnum.ACTIVE);
		});

		it('404s for a user who is not in the program', async () => {
			const stranger = await createUser(dataSource);

			await removeUser(admin, stranger).expect(404);

			expect(await membership(stranger)).toBeNull();
		});
	});

	/**
	 * Leaving deactivates the caller's own membership, unless that would
	 * leave the program with no admin and no super_admin.
	 */
	describe('PATCH /users/:user_id/programs/:program_id (leave)', () => {
		const leave = (actor: User, target: Program = program) =>
			request(app.getHttpServer())
				.patch(
					`/api/users/${actor.userId}/programs/${target.programId}`,
				)
				.set(...asUser(app, actor));

		it('lets a member leave', async () => {
			await leave(viewer).expect(200);

			expect((await membership(viewer))?.status).toBe(
				statusEnum.INACTIVE,
			);

			const programs = await request(app.getHttpServer())
				.get('/api/programs')
				.set(...asUser(app, viewer))
				.expect(200);
			expect(programs.body.data).toEqual([]);
		});

		it('lets an admin leave while a super_admin remains', async () => {
			await leave(admin).expect(200);

			expect((await membership(admin))?.status).toBe(statusEnum.INACTIVE);
		});

		it('400s for the only admin when no super_admin remains', async () => {
			await dataSource
				.getRepository(ProgramUser)
				.update(
					{ programId: program.programId, userId: superAdmin.userId },
					{ role: userRoleEnum.VIEWER },
				);

			await leave(admin).expect(400);

			expect((await membership(admin))?.status).toBe(statusEnum.ACTIVE);
		});

		it('404s for an unknown program', async () => {
			await request(app.getHttpServer())
				.patch(`/api/users/${viewer.userId}/programs/${UNKNOWN_ID}`)
				.set(...asUser(app, viewer))
				.expect(404);
		});
	});

	/**
	 * Users can read members of the programs they share, and read, update
	 * and delete themselves. Program admins can also update the members of
	 * their own program.
	 */
	describe('/users/:user_id', () => {
		describe('GET', () => {
			it('returns the caller themselves', async () => {
				const response = await request(app.getHttpServer())
					.get(`/api/users/${viewer.userId}`)
					.set(...asUser(app, viewer))
					.expect(200);

				expect(response.body.data).toMatchObject({
					user_id: viewer.userId,
					email: viewer.email,
					first_name: viewer.firstName,
					last_name: viewer.lastName,
				});
				expect(response.body.data.password).toBeUndefined();
			});

			it('returns a member of a shared program', async () => {
				const response = await request(app.getHttpServer())
					.get(`/api/users/${admin.userId}`)
					.set(...asUser(app, viewer))
					.expect(200);

				expect(response.body.data.user_id).toBe(admin.userId);
			});

			it('403s for a user who shares no program with the caller', async () => {
				await request(app.getHttpServer())
					.get(`/api/users/${outsider.userId}`)
					.set(...asUser(app, viewer))
					.expect(403);
			});

			it('403s for an unknown user rather than confirming whether it exists', async () => {
				await request(app.getHttpServer())
					.get(`/api/users/${UNKNOWN_ID}`)
					.set(...asUser(app, admin))
					.expect(403);
			});
		});

		describe('PATCH', () => {
			const update = (
				actor: User,
				target: User,
				body: Record<string, unknown>,
			) =>
				request(app.getHttpServer())
					.patch(`/api/users/${target.userId}`)
					.set(...asUser(app, actor))
					.send(body);

			it('lets a user update their own name and email', async () => {
				const email = uniqueEmail('renamed');

				const response = await update(viewer, viewer, {
					first_name: 'New',
					last_name: 'Name',
					email: email.toUpperCase(),
				}).expect(200);

				expect(response.body.data).toMatchObject({
					first_name: 'New',
					last_name: 'Name',
					email,
				});
				const stored = await dataSource
					.getRepository(User)
					.findOneByOrFail({ userId: viewer.userId });
				expect(stored).toMatchObject({
					firstName: 'New',
					lastName: 'Name',
					email,
				});
			});

			it('changes the password when the current one is supplied', async () => {
				await update(viewer, viewer, {
					current_password: 'password',
					new_password: 'brand-new',
				}).expect(200);

				await request(app.getHttpServer())
					.post('/api/users/login')
					.send({ email: viewer.email, password: 'brand-new' })
					.expect(201);
				await request(app.getHttpServer())
					.post('/api/users/login')
					.send({ email: viewer.email, password: 'password' })
					.expect(401);
			});

			it('400s on a wrong current password', async () => {
				await update(viewer, viewer, {
					current_password: 'wrong',
					new_password: 'brand-new',
				}).expect(400);

				await request(app.getHttpServer())
					.post('/api/users/login')
					.send({ email: viewer.email, password: 'password' })
					.expect(201);
			});

			it('400s when only the new password is supplied', async () => {
				await update(viewer, viewer, {
					new_password: 'brand-new',
				}).expect(400);

				const stored = await dataSource
					.getRepository(User)
					.findOneByOrFail({ userId: viewer.userId });
				expect(stored.password).toBe(viewer.password);
			});

			it("400s when taking another user's email", async () => {
				await update(viewer, viewer, { email: admin.email }).expect(
					400,
				);

				const stored = await dataSource
					.getRepository(User)
					.findOneByOrFail({ userId: viewer.userId });
				expect(stored.email).toBe(viewer.email);
			});

			it('rejects an attempt to set the platform role', async () => {
				await update(viewer, viewer, { role: 'super_admin' }).expect(
					400,
				);

				const stored = await dataSource
					.getRepository(User)
					.findOneByOrFail({ userId: viewer.userId });
				expect(stored.role).toBe(userRoleEnum.REGULAR);
			});

			it('lets a program admin update a member of their program', async () => {
				await update(admin, editor, { first_name: 'Edited' }).expect(
					200,
				);

				const stored = await dataSource
					.getRepository(User)
					.findOneByOrFail({ userId: editor.userId });
				expect(stored.firstName).toBe('Edited');
			});

			it.each([
				['editor', () => editor],
				['viewer', () => viewer],
			])(
				'403s when a program %s updates another member',
				async (_label, actor) => {
					await update(actor(), admin, {
						first_name: 'Hijacked',
					}).expect(403);

					const stored = await dataSource
						.getRepository(User)
						.findOneByOrFail({ userId: admin.userId });
					expect(stored.firstName).toBe(admin.firstName);
				},
			);

			it('403s when an admin updates a user outside their program', async () => {
				await update(admin, outsider, {
					first_name: 'Hijacked',
				}).expect(403);

				const stored = await dataSource
					.getRepository(User)
					.findOneByOrFail({ userId: outsider.userId });
				expect(stored.firstName).toBe(outsider.firstName);
			});
		});

		describe('DELETE', () => {
			it('lets a user delete their own account', async () => {
				await request(app.getHttpServer())
					.delete(`/api/users/${viewer.userId}`)
					.set(...asUser(app, viewer))
					.expect(200);

				expect(
					await dataSource
						.getRepository(User)
						.existsBy({ userId: viewer.userId }),
				).toBe(false);
				expect(await membership(viewer)).toBeNull();
			});

			it.each([
				['a program admin', () => admin],
				['the platform super admin', () => superAdmin],
			])('403s when %s deletes someone else', async (_label, actor) => {
				await request(app.getHttpServer())
					.delete(`/api/users/${editor.userId}`)
					.set(...asUser(app, actor()))
					.expect(403);

				expect(
					await dataSource
						.getRepository(User)
						.existsBy({ userId: editor.userId }),
				).toBe(true);
			});
		});
	});

	describe('GET /users/search', () => {
		it('401s without credentials', async () => {
			await request(app.getHttpServer())
				.get('/api/users/search')
				.query({ email: 'test.local' })
				.expect(401);
		});
	});
});
