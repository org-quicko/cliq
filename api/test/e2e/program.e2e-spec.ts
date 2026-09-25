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
	unique,
} from '../support/factories';
import { Circle, Program, ProgramUser, User } from '../../src/entities';
import { statusEnum, userRoleEnum, visibilityEnum } from '../../src/enums';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

const createBody = (overrides: Record<string, unknown> = {}) => ({
	name: unique('Program'),
	currency: 'USD',
	website: 'https://example.com',
	visibility: 'public',
	referral_key_type: 'email',
	time_zone: 'UTC',
	...overrides,
});

/**
 * The program resource itself: creation, the caller-scoped listing, the
 * public read, update, delete and the platform summary.
 *
 * Every program gets the platform super admin attached as a program
 * super_admin (ProgramSubscriber), so "super admin" below always means that
 * user. The interesting boundaries are between that user, the program-scoped
 * admin / editor / viewer roles from getUserAbility, and users who belong to
 * a different program entirely.
 */
describe('programs (e2e)', () => {
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

	beforeEach(async () => {
		superAdmin = await seedSuperAdmin(dataSource);
	});

	async function userWithRole(
		program: Program,
		role: userRoleEnum,
		status = statusEnum.ACTIVE,
	) {
		const user = await createUser(dataSource);
		await addUserToProgram(dataSource, user, program, role, status);
		return user;
	}

	/**
	 * Creating a program is reserved for the platform super admin: `create`
	 * on Program only comes from the `manage` grant in getUserAbility. The
	 * service must also leave the program usable, i.e. with a default circle
	 * and its creator as program super_admin.
	 */
	describe('POST /programs', () => {
		it('creates the program, its DEFAULT_CIRCLE and makes the creator a program super_admin', async () => {
			const body = createBody({
				theme_color: '#123456',
				date_format: 'MM/DD/YYYY',
			});

			const response = await request(app.getHttpServer())
				.post('/api/programs')
				.set(...asUser(app, superAdmin))
				.send(body)
				.expect(201);

			const data = response.body.data;
			expect(data).toMatchObject({
				name: body.name,
				currency: 'USD',
				website: 'https://example.com',
				visibility: 'public',
				referral_key_type: 'email',
				time_zone: 'UTC',
				theme_color: '#123456',
				date_format: 'MM/DD/YYYY',
			});
			expect(typeof data.program_id).toBe('string');

			const circles = await dataSource
				.getRepository(Circle)
				.find({ where: { program: { programId: data.program_id } } });
			expect(circles).toHaveLength(1);
			expect(circles[0]).toMatchObject({
				name: 'DEFAULT_CIRCLE',
				isDefaultCircle: true,
			});

			const programUsers = await dataSource
				.getRepository(ProgramUser)
				.findBy({ programId: data.program_id });
			expect(programUsers).toHaveLength(1);
			expect(programUsers[0]).toMatchObject({
				userId: superAdmin.userId,
				role: userRoleEnum.SUPER_ADMIN,
				status: statusEnum.ACTIVE,
			});
		});

		it('403s for a program admin, who can manage their program but not create new ones', async () => {
			const { program } = await createProgram(dataSource);
			const admin = await userWithRole(program, userRoleEnum.ADMIN);

			await request(app.getHttpServer())
				.post('/api/programs')
				.set(...asUser(app, admin))
				.send(createBody())
				.expect(403);
		});

		it('403s for a user that belongs to no program', async () => {
			const user = await createUser(dataSource);

			await request(app.getHttpServer())
				.post('/api/programs')
				.set(...asUser(app, user))
				.send(createBody())
				.expect(403);
		});

		it('401s without credentials', async () => {
			await request(app.getHttpServer())
				.post('/api/programs')
				.send(createBody())
				.expect(401);
		});

		it.each([
			['an invalid website', { website: 'not a url' }],
			['an unknown visibility', { visibility: 'secret' }],
			['an unknown referral key type', { referral_key_type: 'username' }],
			['an unknown date format', { date_format: 'YYYY' }],
			['a missing name', { name: undefined }],
			['a missing time zone', { time_zone: undefined }],
		])('400s on %s', async (_label, overrides) => {
			const name = unique('Rejected');
			await request(app.getHttpServer())
				.post('/api/programs')
				.set(...asUser(app, superAdmin))
				.send(createBody({ name, ...overrides }))
				.expect(400);

			expect(
				await dataSource.getRepository(Program).countBy({ name }),
			).toBe(0);
		});

		it('rejects an undeclared property such as a client-chosen program_id', async () => {
			await request(app.getHttpServer())
				.post('/api/programs')
				.set(...asUser(app, superAdmin))
				.send(createBody({ program_id: UNKNOWN_ID }))
				.expect(400);

			expect(
				await dataSource
					.getRepository(Program)
					.existsBy({ programId: UNKNOWN_ID }),
			).toBe(false);
		});
	});

	/**
	 * Listing is open to every program user (`read_all` Program is granted
	 * unconditionally) and relies on the service to scope the result to the
	 * caller's active memberships. The optional filters must narrow that set
	 * and, when omitted, must not be turned into `IS NULL` conditions.
	 */
	describe('GET /programs', () => {
		const programIds = (response: request.Response) =>
			(response.body.data as { program_id: string }[]).map(
				(row) => row.program_id,
			);

		it("returns only the caller's programs, with their role in each", async () => {
			const { program: mine } = await createProgram(dataSource);
			const { program: alsoMine } = await createProgram(dataSource);
			const { program: notMine } = await createProgram(dataSource);
			const user = await userWithRole(mine, userRoleEnum.EDITOR);
			await addUserToProgram(
				dataSource,
				user,
				alsoMine,
				userRoleEnum.VIEWER,
			);

			const response = await request(app.getHttpServer())
				.get('/api/programs')
				.set(...asUser(app, user))
				.expect(200);

			const ids = programIds(response);
			expect(ids).toHaveLength(2);
			expect(ids).toEqual(
				expect.arrayContaining([mine.programId, alsoMine.programId]),
			);
			expect(ids).not.toContain(notMine.programId);

			const rows = response.body.data as {
				program_id: string;
				role: string;
				user_id: string;
				program: { name: string };
			}[];
			const mineRow = rows.find(
				(row) => row.program_id === mine.programId,
			)!;
			expect(mineRow).toMatchObject({
				user_id: user.userId,
				role: 'editor',
				status: 'active',
				program: { program_id: mine.programId, name: mine.name },
			});
			expect(
				rows.find((row) => row.program_id === alsoMine.programId)!.role,
			).toBe('viewer');
		});

		it('leaves out programs the caller was removed from', async () => {
			const { program: active } = await createProgram(dataSource);
			const { program: removed } = await createProgram(dataSource);
			const user = await userWithRole(active, userRoleEnum.ADMIN);
			await addUserToProgram(
				dataSource,
				user,
				removed,
				userRoleEnum.ADMIN,
				statusEnum.INACTIVE,
			);

			const response = await request(app.getHttpServer())
				.get('/api/programs')
				.set(...asUser(app, user))
				.expect(200);

			expect(programIds(response)).toEqual([active.programId]);
		});

		it('returns an empty list for a user in no program', async () => {
			await createProgram(dataSource);
			const user = await createUser(dataSource);

			const response = await request(app.getHttpServer())
				.get('/api/programs')
				.set(...asUser(app, user))
				.expect(200);

			expect(response.body.data).toEqual([]);
		});

		it("filters by exact name within the caller's programs", async () => {
			const { program: target } = await createProgram(dataSource);
			const { program: sibling } = await createProgram(dataSource);
			const { program: foreign } = await createProgram(dataSource);
			const user = await userWithRole(target, userRoleEnum.VIEWER);
			await addUserToProgram(
				dataSource,
				user,
				sibling,
				userRoleEnum.VIEWER,
			);

			const byName = await request(app.getHttpServer())
				.get('/api/programs')
				.query({ name: target.name })
				.set(...asUser(app, user))
				.expect(200);
			expect(programIds(byName)).toEqual([target.programId]);

			// The name of a program the caller is not in must not leak it.
			const foreignName = await request(app.getHttpServer())
				.get('/api/programs')
				.query({ name: foreign.name })
				.set(...asUser(app, user))
				.expect(200);
			expect(foreignName.body.data).toEqual([]);
		});

		it('filters by visibility', async () => {
			const { program: publicProgram } = await createProgram(dataSource, {
				visibility: visibilityEnum.PUBLIC,
			});
			const { program: privateProgram } = await createProgram(
				dataSource,
				{ visibility: visibilityEnum.PRIVATE },
			);
			const user = await userWithRole(publicProgram, userRoleEnum.VIEWER);
			await addUserToProgram(
				dataSource,
				user,
				privateProgram,
				userRoleEnum.VIEWER,
			);

			const privateOnly = await request(app.getHttpServer())
				.get('/api/programs')
				.query({ visibility: 'private' })
				.set(...asUser(app, user))
				.expect(200);
			expect(programIds(privateOnly)).toEqual([privateProgram.programId]);

			const combined = await request(app.getHttpServer())
				.get('/api/programs')
				.query({ visibility: 'public', name: privateProgram.name })
				.set(...asUser(app, user))
				.expect(200);
			expect(combined.body.data).toEqual([]);
		});

		it('pages with skip and take', async () => {
			const user = await createUser(dataSource);
			for (let i = 0; i < 3; i++) {
				const { program } = await createProgram(dataSource);
				await addUserToProgram(
					dataSource,
					user,
					program,
					userRoleEnum.VIEWER,
				);
			}

			const all = await request(app.getHttpServer())
				.get('/api/programs')
				.set(...asUser(app, user))
				.expect(200);
			expect(all.body.data).toHaveLength(3);

			const page = await request(app.getHttpServer())
				.get('/api/programs')
				.query({ skip: 1, take: 1 })
				.set(...asUser(app, user))
				.expect(200);
			expect(page.body.data).toHaveLength(1);
		});

		it('401s without credentials', async () => {
			await request(app.getHttpServer()).get('/api/programs').expect(401);
		});
	});

	/**
	 * GET /programs/:id is @Public: the promoter portal reads program
	 * branding before anyone has logged in, so it needs no token at all.
	 */
	describe('GET /programs/:program_id', () => {
		it('returns the program without credentials', async () => {
			const { program } = await createProgram(dataSource, {
				currency: 'INR',
			});

			const response = await request(app.getHttpServer())
				.get(`/api/programs/${program.programId}`)
				.expect(200);

			expect(response.body.data).toMatchObject({
				program_id: program.programId,
				name: program.name,
				currency: 'INR',
				visibility: 'public',
				referral_key_type: 'email',
			});
		});

		it('404s for an unknown program', async () => {
			await request(app.getHttpServer())
				.get(`/api/programs/${UNKNOWN_ID}`)
				.expect(404);
		});

		it('404s for an id that is not a UUID', async () => {
			await request(app.getHttpServer())
				.get('/api/programs/not-a-uuid')
				.expect(404);
		});
	});

	/**
	 * `update` Program is granted to the platform super admin and to program
	 * admins / super_admins with a `{ programId }` condition checked against
	 * the loaded program, so membership in a different program must not
	 * carry over.
	 */
	describe('PATCH /programs/:program_id', () => {
		it('lets a program admin update the program', async () => {
			const { program } = await createProgram(dataSource);
			const admin = await userWithRole(program, userRoleEnum.ADMIN);

			await request(app.getHttpServer())
				.patch(`/api/programs/${program.programId}`)
				.set(...asUser(app, admin))
				.send({
					name: 'Renamed',
					visibility: 'private',
					theme_color: '#abcdef',
					terms_and_conditions: 'Be nice',
					website: 'https://renamed.example.com',
				})
				.expect(200);

			const stored = await dataSource
				.getRepository(Program)
				.findOneByOrFail({ programId: program.programId });
			expect(stored).toMatchObject({
				name: 'Renamed',
				visibility: visibilityEnum.PRIVATE,
				themeColor: '#abcdef',
				termsAndConditions: 'Be nice',
				website: 'https://renamed.example.com',
				currency: program.currency,
			});
		});

		it('lets the platform super admin update any program', async () => {
			const { program } = await createProgram(dataSource);

			await request(app.getHttpServer())
				.patch(`/api/programs/${program.programId}`)
				.set(...asUser(app, superAdmin))
				.send({ currency: 'EUR' })
				.expect(200);

			const stored = await dataSource
				.getRepository(Program)
				.findOneByOrFail({ programId: program.programId });
			expect(stored.currency).toBe('EUR');
		});

		it.each([userRoleEnum.EDITOR, userRoleEnum.VIEWER])(
			'403s for a program %s',
			async (role) => {
				const { program } = await createProgram(dataSource);
				const user = await userWithRole(program, role);

				await request(app.getHttpServer())
					.patch(`/api/programs/${program.programId}`)
					.set(...asUser(app, user))
					.send({ name: 'Hijacked' })
					.expect(403);

				const stored = await dataSource
					.getRepository(Program)
					.findOneByOrFail({ programId: program.programId });
				expect(stored.name).toBe(program.name);
			},
		);

		it('403s for the admin of a different program', async () => {
			const { program } = await createProgram(dataSource);
			const { program: otherProgram } = await createProgram(dataSource);
			const otherAdmin = await userWithRole(
				otherProgram,
				userRoleEnum.ADMIN,
			);

			await request(app.getHttpServer())
				.patch(`/api/programs/${program.programId}`)
				.set(...asUser(app, otherAdmin))
				.send({ name: 'Hijacked' })
				.expect(403);

			const stored = await dataSource
				.getRepository(Program)
				.findOneByOrFail({ programId: program.programId });
			expect(stored.name).toBe(program.name);
		});

		it('403s for an admin who has been removed from the program', async () => {
			const { program } = await createProgram(dataSource);
			const removed = await userWithRole(
				program,
				userRoleEnum.ADMIN,
				statusEnum.INACTIVE,
			);

			await request(app.getHttpServer())
				.patch(`/api/programs/${program.programId}`)
				.set(...asUser(app, removed))
				.send({ name: 'Hijacked' })
				.expect(403);
		});

		it('404s for an unknown program', async () => {
			await request(app.getHttpServer())
				.patch(`/api/programs/${UNKNOWN_ID}`)
				.set(...asUser(app, superAdmin))
				.send({ name: 'Nothing' })
				.expect(404);
		});

		it.each([
			['an undeclared property', { referral_key_type: 'phone' }],
			['an invalid website', { website: 'nope' }],
			['an unknown visibility', { visibility: 'secret' }],
			['an unknown date format', { date_format: 'YYYY' }],
		])('400s on %s', async (_label, body) => {
			const { program } = await createProgram(dataSource);
			const admin = await userWithRole(program, userRoleEnum.ADMIN);

			await request(app.getHttpServer())
				.patch(`/api/programs/${program.programId}`)
				.set(...asUser(app, admin))
				.send(body)
				.expect(400);

			const stored = await dataSource
				.getRepository(Program)
				.findOneByOrFail({ programId: program.programId });
			expect(stored.referralKeyType).toBe(program.referralKeyType);
			expect(stored.website).toBe(program.website);
			expect(stored.visibility).toBe(program.visibility);
			expect(stored.name).toBe(program.name);
		});
	});

	/**
	 * Only the platform super admin holds `delete` on Program; program-scoped
	 * admins can update but not delete.
	 */
	describe('DELETE /programs/:program_id', () => {
		it('lets the platform super admin delete a program, taking its memberships with it', async () => {
			const { program } = await createProgram(dataSource);
			await userWithRole(program, userRoleEnum.ADMIN);

			await request(app.getHttpServer())
				.delete(`/api/programs/${program.programId}`)
				.set(...asUser(app, superAdmin))
				.expect(200);

			expect(
				await dataSource
					.getRepository(Program)
					.existsBy({ programId: program.programId }),
			).toBe(false);
			expect(
				await dataSource
					.getRepository(ProgramUser)
					.countBy({ programId: program.programId }),
			).toBe(0);
			expect(
				await dataSource
					.getRepository(Circle)
					.countBy({ program: { programId: program.programId } }),
			).toBe(0);

			await request(app.getHttpServer())
				.get(`/api/programs/${program.programId}`)
				.expect(404);
		});

		it.each([userRoleEnum.ADMIN, userRoleEnum.EDITOR, userRoleEnum.VIEWER])(
			'403s for a program %s',
			async (role) => {
				const { program } = await createProgram(dataSource);
				const user = await userWithRole(program, role);

				await request(app.getHttpServer())
					.delete(`/api/programs/${program.programId}`)
					.set(...asUser(app, user))
					.expect(403);

				expect(
					await dataSource
						.getRepository(Program)
						.existsBy({ programId: program.programId }),
				).toBe(true);
			},
		);

		it('404s for an unknown program', async () => {
			await request(app.getHttpServer())
				.delete(`/api/programs/${UNKNOWN_ID}`)
				.set(...asUser(app, superAdmin))
				.expect(404);
		});
	});

	/**
	 * The summary reads program_summary_mv, a real materialized view that is
	 * only refreshed on a schedule (and on program removal), so each test
	 * refreshes it after arranging data. `total_promoters` is deliberately
	 * not asserted: the view currently derives it from referral_mv, which is
	 * a known, deferred product issue.
	 */
	describe('GET /programs/summary', () => {
		const refreshSummary = () =>
			dataSource.query(
				'REFRESH MATERIALIZED VIEW program_summary_mv WITH DATA;',
			);

		const summaryRows = (response: request.Response) => {
			const block = response.body.data.sheets[0].blocks[0];
			const header = block.header as string[];
			return (block.rows as unknown[][]).map((row) =>
				Object.fromEntries(header.map((column, i) => [column, row[i]])),
			);
		};

		it('lists every program for the platform super admin', async () => {
			const { program: first } = await createProgram(dataSource);
			const { program: second } = await createProgram(dataSource);
			await refreshSummary();

			const response = await request(app.getHttpServer())
				.get('/api/programs/summary')
				.set(...asUser(app, superAdmin))
				.expect(200);

			const block = response.body.data.sheets[0].blocks[0];
			expect(block.header).toEqual([
				'program_id',
				'program_name',
				'total_promoters',
				'total_referrals',
				'created_at',
			]);

			const rows = summaryRows(response);
			const ids = rows.map((row) => row.program_id);
			expect(ids).toEqual(
				expect.arrayContaining([first.programId, second.programId]),
			);
			expect(
				rows.find((row) => row.program_id === first.programId),
			).toMatchObject({
				program_name: first.name,
				total_referrals: 0,
			});
			expect(response.body.data.metadata).toMatchObject({
				skip: 0,
				take: 10,
				total: rows.length,
			});
		});

		it('filters by program_id and by a partial, case-insensitive name', async () => {
			const { program: target } = await createProgram(dataSource, {
				name: unique('Summary-Target'),
			});
			const { program: other } = await createProgram(dataSource);
			await refreshSummary();

			const byId = await request(app.getHttpServer())
				.get('/api/programs/summary')
				.query({ program_id: target.programId })
				.set(...asUser(app, superAdmin))
				.expect(200);
			expect(summaryRows(byId).map((row) => row.program_id)).toEqual([
				target.programId,
			]);

			const byName = await request(app.getHttpServer())
				.get('/api/programs/summary')
				.query({ name: target.name.slice(0, -3).toUpperCase() })
				.set(...asUser(app, superAdmin))
				.expect(200);
			const ids = summaryRows(byName).map((row) => row.program_id);
			expect(ids).toContain(target.programId);
			expect(ids).not.toContain(other.programId);
		});

		it('pages with skip and take and reports the full total', async () => {
			for (let i = 0; i < 3; i++) {
				await createProgram(dataSource);
			}
			await refreshSummary();

			const response = await request(app.getHttpServer())
				.get('/api/programs/summary')
				.query({ skip: 1, take: 2 })
				.set(...asUser(app, superAdmin))
				.expect(200);

			expect(summaryRows(response)).toHaveLength(2);
			expect(response.body.data.metadata).toMatchObject({
				skip: 1,
				take: 2,
			});
			expect(response.body.data.metadata.total).toBeGreaterThanOrEqual(3);
		});

		it('401s without credentials', async () => {
			await request(app.getHttpServer())
				.get('/api/programs/summary')
				.expect(401);
		});
	});
});
