import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import { asMember } from '../support/auth';
import {
	createMember,
	createProgram,
	createPromoter,
	uniqueEmail,
} from '../support/factories';
import { workbookRows } from '../support/promoter-helpers';
import { Member, Program, Promoter, PromoterMember } from '../../src/entities';
import { memberRoleEnum, statusEnum } from '../../src/enums';

/**
 * Promoter membership (invite, list, change role, remove) and a member's
 * own account (read, update incl. password change, delete, the public
 * "exists" check). Only promoter admins manage membership; every member of
 * a promoter can see its roster; a member may only edit their own account.
 */
describe('promoter members (e2e)', () => {
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

	const membersUrl = (programId: string, promoterId: string) =>
		`/api/programs/${programId}/promoters/${promoterId}/members`;
	const memberUrl = (programId: string, memberId: string) =>
		`/api/programs/${programId}/members/${memberId}`;

	/** Adds an existing member account to a promoter with the given role. */
	async function joinPromoter(
		program: Program,
		promoter: Promoter,
		role: memberRoleEnum,
		status: statusEnum = statusEnum.ACTIVE,
	): Promise<Member> {
		const member = await createMember(dataSource, program, {
			password: 'password',
		});
		await dataSource.getRepository(PromoterMember).save({
			promoterId: promoter.promoterId,
			memberId: member.memberId,
			role,
			status,
		});
		return member;
	}

	const inviteBody = (overrides: Record<string, unknown> = {}) => ({
		email: uniqueEmail('invitee'),
		password: 'invitee-pass',
		first_name: 'In',
		last_name: 'Vitee',
		role: memberRoleEnum.EDITOR,
		...overrides,
	});

	describe('POST /programs/:program_id/promoters/:promoter_id/members', () => {
		it('creates the invitee in the program with the requested role, able to log in', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: admin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const body = inviteBody();

			const response = await request(app.getHttpServer())
				.post(membersUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, admin))
				.send(body)
				.expect(201);

			const [row] = workbookRows(response.body.data, 'member_table');
			expect(row).toMatchObject({
				email: body.email,
				first_name: 'In',
				last_name: 'Vitee',
				role: memberRoleEnum.EDITOR,
			});

			const invitee = await dataSource
				.getRepository(Member)
				.findOneOrFail({
					where: { email: body.email },
					relations: { program: true },
				});
			expect(invitee.program.programId).toBe(program.programId);
			const membership = await dataSource
				.getRepository(PromoterMember)
				.findOneByOrFail({ memberId: invitee.memberId });
			expect(membership).toMatchObject({
				promoterId: promoter.promoterId,
				role: memberRoleEnum.EDITOR,
				status: statusEnum.ACTIVE,
			});

			const login = await request(app.getHttpServer())
				.post(`/api/programs/${program.programId}/members/login`)
				.send({ email: body.email, password: 'invitee-pass' })
				.expect(201);
			expect(typeof login.body.data.access_token).toBe('string');
		});

		it('reactivates a previously removed member with the new role', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: admin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const removed = await joinPromoter(
				program,
				promoter,
				memberRoleEnum.VIEWER,
				statusEnum.INACTIVE,
			);

			await request(app.getHttpServer())
				.post(membersUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, admin))
				.send(
					inviteBody({
						email: removed.email,
						role: memberRoleEnum.EDITOR,
					}),
				)
				.expect(201);

			const membership = await dataSource
				.getRepository(PromoterMember)
				.findOneByOrFail({ memberId: removed.memberId });
			expect(membership.status).toBe(statusEnum.ACTIVE);
			expect(membership.role).toBe(memberRoleEnum.EDITOR);
		});

		it('409s for an email already active in a promoter of the program', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: admin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const { member: taken } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await request(app.getHttpServer())
				.post(membersUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, admin))
				.send(inviteBody({ email: taken.email }))
				.expect(409);
		});

		it.each([memberRoleEnum.EDITOR, memberRoleEnum.VIEWER])(
			'is reserved for promoter admins (%s gets 403)',
			async (role) => {
				const { program, defaultCircle } =
					await createProgram(dataSource);
				const { promoter, member } = await createPromoter(
					dataSource,
					program,
					defaultCircle,
					{
						memberRole: role,
					},
				);
				const body = inviteBody();

				await request(app.getHttpServer())
					.post(membersUrl(program.programId, promoter.promoterId))
					.set(...asMember(app, member))
					.send(body)
					.expect(403);

				expect(
					await dataSource
						.getRepository(Member)
						.countBy({ email: body.email }),
				).toBe(0);
			},
		);

		it('403s for the admin of a different promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { member: otherAdmin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await request(app.getHttpServer())
				.post(membersUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, otherAdmin))
				.send(inviteBody())
				.expect(403);
		});

		it.each([
			['an invalid email', { email: 'not-an-email' }],
			['an unknown role', { role: 'owner' }],
			['an undeclared property', { status: statusEnum.ACTIVE }],
		])('rejects %s', async (_label, overrides) => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: admin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await request(app.getHttpServer())
				.post(membersUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, admin))
				.send(inviteBody(overrides))
				.expect(400);
		});
	});

	describe('GET /programs/:program_id/promoters/:promoter_id/members', () => {
		it.each(Object.values(memberRoleEnum))(
			'lists the roster to a %s',
			async (role) => {
				const { program, defaultCircle } =
					await createProgram(dataSource);
				const { promoter, member } = await createPromoter(
					dataSource,
					program,
					defaultCircle,
					{
						memberRole: role,
					},
				);
				const colleague = await joinPromoter(
					program,
					promoter,
					memberRoleEnum.VIEWER,
				);

				const response = await request(app.getHttpServer())
					.get(membersUrl(program.programId, promoter.promoterId))
					.set(...asMember(app, member))
					.expect(200);

				const byId = Object.fromEntries(
					(
						response.body.data as {
							member_id: string;
							role: string;
						}[]
					).map((m) => [m.member_id, m]),
				);
				expect(Object.keys(byId).sort()).toEqual(
					[member.memberId, colleague.memberId].sort(),
				);
				expect(byId[member.memberId]).toMatchObject({
					email: member.email,
					role,
					status: statusEnum.ACTIVE,
				});
				expect(byId[member.memberId]).not.toHaveProperty('password');
			},
		);

		it('filters by role', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: admin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const editor = await joinPromoter(
				program,
				promoter,
				memberRoleEnum.EDITOR,
			);
			await joinPromoter(program, promoter, memberRoleEnum.VIEWER);

			const response = await request(app.getHttpServer())
				.get(membersUrl(program.programId, promoter.promoterId))
				.query({ role: memberRoleEnum.EDITOR })
				.set(...asMember(app, admin))
				.expect(200);

			expect(
				response.body.data.map(
					(m: { member_id: string }) => m.member_id,
				),
			).toEqual([editor.memberId]);
		});

		it('returns a member_table workbook for the sheet-json accept type', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: admin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			await joinPromoter(program, promoter, memberRoleEnum.EDITOR);

			const response = await request(app.getHttpServer())
				.get(membersUrl(program.programId, promoter.promoterId))
				.set('x-accept-type', 'application/json;format=sheet-json')
				.set(...asMember(app, admin))
				.expect(200);

			const rows = workbookRows(response.body.data, 'member_table');
			expect(rows).toHaveLength(2);
			expect(rows.map((r) => r.email)).toContain(admin.email);
		});

		it('403s for a member of a different promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { member: outsider } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await request(app.getHttpServer())
				.get(membersUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, outsider))
				.expect(403);
		});
	});

	describe('PATCH /programs/:program_id/promoters/:promoter_id/members/:member_id/role', () => {
		it("lets an admin change a colleague's role", async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: admin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const editor = await joinPromoter(
				program,
				promoter,
				memberRoleEnum.EDITOR,
			);

			await request(app.getHttpServer())
				.patch(
					`${membersUrl(program.programId, promoter.promoterId)}/${editor.memberId}/role`,
				)
				.set(...asMember(app, admin))
				.send({ role: memberRoleEnum.VIEWER })
				.expect(200);

			const membership = await dataSource
				.getRepository(PromoterMember)
				.findOneByOrFail({ memberId: editor.memberId });
			expect(membership.role).toBe(memberRoleEnum.VIEWER);
		});

		it('400s when an admin targets themselves', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: admin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await request(app.getHttpServer())
				.patch(
					`${membersUrl(program.programId, promoter.promoterId)}/${admin.memberId}/role`,
				)
				.set(...asMember(app, admin))
				.send({ role: memberRoleEnum.VIEWER })
				.expect(400);
		});

		it('rejects an unknown role', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: admin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const editor = await joinPromoter(
				program,
				promoter,
				memberRoleEnum.EDITOR,
			);

			await request(app.getHttpServer())
				.patch(
					`${membersUrl(program.programId, promoter.promoterId)}/${editor.memberId}/role`,
				)
				.set(...asMember(app, admin))
				.send({ role: 'owner' })
				.expect(400);
		});

		it('403s for a promoter editor', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: editor } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
				{
					memberRole: memberRoleEnum.EDITOR,
				},
			);
			const viewer = await joinPromoter(
				program,
				promoter,
				memberRoleEnum.VIEWER,
			);

			await request(app.getHttpServer())
				.patch(
					`${membersUrl(program.programId, promoter.promoterId)}/${viewer.memberId}/role`,
				)
				.set(...asMember(app, editor))
				.send({ role: memberRoleEnum.ADMIN })
				.expect(403);

			const membership = await dataSource
				.getRepository(PromoterMember)
				.findOneByOrFail({ memberId: viewer.memberId });
			expect(membership.role).toBe(memberRoleEnum.VIEWER);
		});

		it('403s for the admin of a different promoter addressing that promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { member: outsider } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const { promoter, member: target } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await request(app.getHttpServer())
				.patch(
					`${membersUrl(program.programId, promoter.promoterId)}/${target.memberId}/role`,
				)
				.set(...asMember(app, outsider))
				.send({ role: memberRoleEnum.VIEWER })
				.expect(403);

			const membership = await dataSource
				.getRepository(PromoterMember)
				.findOneByOrFail({ memberId: target.memberId });
			expect(membership.role).toBe(memberRoleEnum.ADMIN);
		});
	});

	describe('PATCH /programs/:program_id/promoters/:promoter_id/members/:member_id (remove)', () => {
		it('deactivates the member, who then loses access to the promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: admin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const viewer = await joinPromoter(
				program,
				promoter,
				memberRoleEnum.VIEWER,
			);

			await request(app.getHttpServer())
				.patch(
					`${membersUrl(program.programId, promoter.promoterId)}/${viewer.memberId}`,
				)
				.set(...asMember(app, admin))
				.expect(200);

			const membership = await dataSource
				.getRepository(PromoterMember)
				.findOneByOrFail({ memberId: viewer.memberId });
			expect(membership.status).toBe(statusEnum.INACTIVE);

			await request(app.getHttpServer())
				.get(membersUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, viewer))
				.expect(403);
		});

		it('403s for a promoter editor', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: editor } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
				{
					memberRole: memberRoleEnum.EDITOR,
				},
			);
			const viewer = await joinPromoter(
				program,
				promoter,
				memberRoleEnum.VIEWER,
			);

			await request(app.getHttpServer())
				.patch(
					`${membersUrl(program.programId, promoter.promoterId)}/${viewer.memberId}`,
				)
				.set(...asMember(app, editor))
				.expect(403);

			const membership = await dataSource
				.getRepository(PromoterMember)
				.findOneByOrFail({ memberId: viewer.memberId });
			expect(membership.status).toBe(statusEnum.ACTIVE);
		});

		it('cannot remove a member of a different promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const home = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const foreign = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			// Via the foreign promoter's path: not a member there.
			await request(app.getHttpServer())
				.patch(
					`${membersUrl(program.programId, foreign.promoter.promoterId)}/${foreign.member.memberId}`,
				)
				.set(...asMember(app, home.member))
				.expect(403);

			// Via their own promoter's path: the update is scoped to that promoter.
			await request(app.getHttpServer())
				.patch(
					`${membersUrl(program.programId, home.promoter.promoterId)}/${foreign.member.memberId}`,
				)
				.set(...asMember(app, home.member));

			const membership = await dataSource
				.getRepository(PromoterMember)
				.findOneByOrFail({ memberId: foreign.member.memberId });
			expect(membership.status).toBe(statusEnum.ACTIVE);
		});
	});

	describe('GET /programs/:program_id/members/:member_id', () => {
		it("returns a member's own account with their promoter role, without the password", async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			const response = await request(app.getHttpServer())
				.get(memberUrl(program.programId, member.memberId))
				.set(...asMember(app, member))
				.expect(200);

			expect(response.body.data).toMatchObject({
				member_id: member.memberId,
				email: member.email,
				first_name: member.firstName,
				last_name: member.lastName,
				role: memberRoleEnum.ADMIN,
				status: statusEnum.ACTIVE,
			});
			expect(response.body.data).not.toHaveProperty('password');
		});

		it('lets a member read a colleague in the same promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
				{
					memberRole: memberRoleEnum.VIEWER,
				},
			);
			const colleague = await joinPromoter(
				program,
				promoter,
				memberRoleEnum.EDITOR,
			);

			const response = await request(app.getHttpServer())
				.get(memberUrl(program.programId, colleague.memberId))
				.set(...asMember(app, member))
				.expect(200);
			expect(response.body.data.role).toBe(memberRoleEnum.EDITOR);
		});

		it('403s for a member of a different promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const { member: stranger } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await request(app.getHttpServer())
				.get(memberUrl(program.programId, stranger.memberId))
				.set(...asMember(app, member))
				.expect(403);
		});

		it('404s for an unknown member', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await request(app.getHttpServer())
				.get(
					memberUrl(
						program.programId,
						'00000000-0000-4000-8000-000000000000',
					),
				)
				.set(...asMember(app, member))
				.expect(404);
		});
	});

	describe('PATCH /programs/:program_id/members/:member_id', () => {
		it("updates the member's own names", async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			const response = await request(app.getHttpServer())
				.patch(memberUrl(program.programId, member.memberId))
				.set(...asMember(app, member))
				.send({ first_name: 'New', last_name: 'Name' })
				.expect(200);

			expect(response.body.data).toMatchObject({
				first_name: 'New',
				last_name: 'Name',
			});
			const stored = await dataSource
				.getRepository(Member)
				.findOneByOrFail({ memberId: member.memberId });
			expect(stored.firstName).toBe('New');
			expect(stored.lastName).toBe('Name');
		});

		it('changes the password when the current one is supplied', async () => {
			const { program } = await createProgram(dataSource);
			const member = await createMember(dataSource, program, {
				password: 'old-password',
			});
			const login = (password: string) =>
				request(app.getHttpServer())
					.post(`/api/programs/${program.programId}/members/login`)
					.send({ email: member.email, password });

			await request(app.getHttpServer())
				.patch(memberUrl(program.programId, member.memberId))
				.set(...asMember(app, member))
				.send({
					current_password: 'old-password',
					new_password: 'new-password',
				})
				.expect(200);

			expect((await login('new-password')).status).toBe(201);
			expect((await login('old-password')).status).toBe(401);
		});

		it('400s on a wrong current password and keeps the old one', async () => {
			const { program } = await createProgram(dataSource);
			const member = await createMember(dataSource, program, {
				password: 'old-password',
			});

			await request(app.getHttpServer())
				.patch(memberUrl(program.programId, member.memberId))
				.set(...asMember(app, member))
				.send({
					current_password: 'wrong',
					new_password: 'new-password',
				})
				.expect(400);

			await request(app.getHttpServer())
				.post(`/api/programs/${program.programId}/members/login`)
				.send({ email: member.email, password: 'old-password' })
				.expect(201);
		});

		it('400s when only the new password is supplied', async () => {
			const { program } = await createProgram(dataSource);
			const member = await createMember(dataSource, program);

			await request(app.getHttpServer())
				.patch(memberUrl(program.programId, member.memberId))
				.set(...asMember(app, member))
				.send({ new_password: 'new-password' })
				.expect(400);
		});

		it('400s when switching to an email already used in the program', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const { member: other } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await request(app.getHttpServer())
				.patch(memberUrl(program.programId, member.memberId))
				.set(...asMember(app, member))
				.send({ email: other.email })
				.expect(400);
		});

		it('403s when editing someone else, even a colleague', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: admin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const colleague = await joinPromoter(
				program,
				promoter,
				memberRoleEnum.VIEWER,
			);

			await request(app.getHttpServer())
				.patch(memberUrl(program.programId, colleague.memberId))
				.set(...asMember(app, admin))
				.send({ first_name: 'Hijacked' })
				.expect(403);

			const stored = await dataSource
				.getRepository(Member)
				.findOneByOrFail({ memberId: colleague.memberId });
			expect(stored.firstName).not.toBe('Hijacked');
		});

		it('rejects an undeclared property', async () => {
			const { program } = await createProgram(dataSource);
			const member = await createMember(dataSource, program);

			await request(app.getHttpServer())
				.patch(memberUrl(program.programId, member.memberId))
				.set(...asMember(app, member))
				.send({ role: memberRoleEnum.ADMIN })
				.expect(400);
		});
	});

	describe('DELETE /programs/:program_id/members/:member_id', () => {
		it("deletes a non-admin member's own account", async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const viewer = await joinPromoter(
				program,
				promoter,
				memberRoleEnum.VIEWER,
			);

			await request(app.getHttpServer())
				.delete(memberUrl(program.programId, viewer.memberId))
				.set(...asMember(app, viewer))
				.expect(200);

			expect(
				await dataSource
					.getRepository(Member)
					.countBy({ memberId: viewer.memberId }),
			).toBe(0);
		});

		it('403s when deleting someone else', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member: admin } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const viewer = await joinPromoter(
				program,
				promoter,
				memberRoleEnum.VIEWER,
			);

			await request(app.getHttpServer())
				.delete(memberUrl(program.programId, viewer.memberId))
				.set(...asMember(app, admin))
				.expect(403);

			expect(
				await dataSource
					.getRepository(Member)
					.countBy({ memberId: viewer.memberId }),
			).toBe(1);
		});
	});

	describe('POST /programs/:program_id/members/exists', () => {
		it('is public and true for a member active in a promoter of the program', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			const response = await request(app.getHttpServer())
				.post(`/api/programs/${program.programId}/members/exists`)
				.send({ email: member.email })
				.expect(201);
			expect(response.body.data).toBe(true);
		});

		it('is false for an unknown email, a member with no promoter, or another program', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { program: otherProgram } = await createProgram(dataSource);
			const loner = await createMember(dataSource, program);
			const { member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			for (const [programId, email] of [
				[program.programId, uniqueEmail('nobody')],
				[program.programId, loner.email],
				[otherProgram.programId, member.email],
			]) {
				const response = await request(app.getHttpServer())
					.post(`/api/programs/${programId}/members/exists`)
					.send({ email })
					.expect(201);
				expect(response.body.data).toBe(false);
			}
		});

		it('rejects an invalid email', async () => {
			const { program } = await createProgram(dataSource);

			await request(app.getHttpServer())
				.post(`/api/programs/${program.programId}/members/exists`)
				.send({ email: 'nope' })
				.expect(400);
		});
	});

	describe('GET /programs/:program_id/members/:member_id/promoter', () => {
		it('returns the promoter a member belongs to', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			const response = await request(app.getHttpServer())
				.get(
					`${memberUrl(program.programId, member.memberId)}/promoter`,
				)
				.set(...asMember(app, member))
				.expect(200);

			expect(response.body.data).toMatchObject({
				promoter_id: promoter.promoterId,
				accepted_terms_and_conditions: true,
			});
		});

		it('404s for a member without a promoter', async () => {
			const { program } = await createProgram(dataSource);
			const member = await createMember(dataSource, program);

			await request(app.getHttpServer())
				.get(
					`${memberUrl(program.programId, member.memberId)}/promoter`,
				)
				.set(...asMember(app, member))
				.expect(404);
		});
	});
});
