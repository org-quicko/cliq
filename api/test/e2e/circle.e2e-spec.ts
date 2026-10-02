import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import {
	apiKeyHeaders,
	asMember,
	asUser,
	createApiKeyCredentials,
} from '../support/auth';
import {
	addUserToProgram,
	createMember,
	createPromoter,
	createUser,
	seedSuperAdmin,
} from '../support/factories';
import {
	circleListMetadata,
	circleRows,
	createCircle,
	createProgramWithRoles,
	ProgramWithRoles,
} from '../support/circle-helpers';
import { Circle, CirclePromoter } from '../../src/entities';
import { statusEnum, userRoleEnum } from '../../src/enums';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

/**
 * Circles group a program's promoters; every program owns a DEFAULT_CIRCLE
 * that new promoters land in. Covers CRUD, circle membership and who may do
 * what (program admin/editor manage, viewer reads, program API keys manage).
 */
describe('circles (e2e)', () => {
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

	const circlesPath = (f: Pick<ProgramWithRoles, 'program'>) =>
		`/api/programs/${f.program.programId}/circles`;

	/**
	 * POST /programs/:program_id/circles
	 */
	describe('create', () => {
		it('creates a non-default circle in the program', async () => {
			const f = await createProgramWithRoles(dataSource);

			const response = await request(app.getHttpServer())
				.post(circlesPath(f))
				.set(...asUser(app, f.admin))
				.send({ name: 'Gold' })
				.expect(201);

			expect(response.body.data).toMatchObject({
				circle_id: expect.any(String),
				name: 'Gold',
				isDefaultCircle: false,
				created_at: expect.any(String),
				updated_at: expect.any(String),
			});

			const stored = await dataSource
				.getRepository(Circle)
				.findOneByOrFail({ circleId: response.body.data.circle_id });
			expect(stored.programId).toBe(f.program.programId);
			expect(stored.isDefaultCircle).toBe(false);
		});

		it('400s without a name', async () => {
			const f = await createProgramWithRoles(dataSource);

			await request(app.getHttpServer())
				.post(circlesPath(f))
				.set(...asUser(app, f.admin))
				.send({})
				.expect(400);
		});

		it('400s on an undeclared property', async () => {
			const f = await createProgramWithRoles(dataSource);

			// The DTO field is camelCase `isDefaultCircle`; the snake_case
			// spelling is not declared, so forbidNonWhitelisted rejects it.
			await request(app.getHttpServer())
				.post(circlesPath(f))
				.set(...asUser(app, f.admin))
				.send({ name: 'Gold', is_default_circle: true })
				.expect(400);
		});
	});

	/**
	 * GET /programs/:program_id/circles (workbook response)
	 */
	describe('list', () => {
		it("returns the program's circles with promoter counts and paging metadata", async () => {
			const f = await createProgramWithRoles(dataSource);
			const gold = await createCircle(dataSource, f.program, 'Gold');
			await createPromoter(dataSource, f.program, f.defaultCircle);
			await createPromoter(dataSource, f.program, f.defaultCircle);
			await createPromoter(dataSource, f.program, gold);

			const response = await request(app.getHttpServer())
				.get(circlesPath(f))
				.set(...asUser(app, f.admin))
				.expect(200);

			const rows = circleRows(response.body);
			expect(rows).toHaveLength(2);
			expect(rows).toEqual(
				expect.arrayContaining([
					{
						circle_id: f.defaultCircle.circleId,
						name: 'DEFAULT_CIRCLE',
						number_of_promoters: 2,
						is_default_circle: true,
					},
					{
						circle_id: gold.circleId,
						name: 'Gold',
						number_of_promoters: 1,
						is_default_circle: false,
					},
				]),
			);
			expect(circleListMetadata(response.body)).toEqual({
				skip: 0,
				take: 10,
				total: 2,
			});
		});

		it("never includes another program's circles", async () => {
			const f = await createProgramWithRoles(dataSource);

			const response = await request(app.getHttpServer())
				.get(circlesPath(f))
				.set(...asUser(app, f.admin))
				.expect(200);

			const ids = circleRows(response.body).map((row) => row.circle_id);
			expect(ids).toEqual([f.defaultCircle.circleId]);
		});

		it('narrows by a case-insensitive name fragment when name is given', async () => {
			const f = await createProgramWithRoles(dataSource);
			const gold = await createCircle(dataSource, f.program, 'Gold Tier');
			await createCircle(dataSource, f.program, 'Silver Tier');

			const response = await request(app.getHttpServer())
				.get(circlesPath(f))
				.query({ name: 'gold' })
				.set(...asUser(app, f.admin))
				.expect(200);

			expect(
				circleRows(response.body).map((row) => row.circle_id),
			).toEqual([gold.circleId]);
			expect(circleListMetadata(response.body).total).toBe(1);
		});

		it('pages with skip and take while reporting the full total', async () => {
			const f = await createProgramWithRoles(dataSource);
			await createCircle(dataSource, f.program, 'Gold');
			await createCircle(dataSource, f.program, 'Silver');

			const response = await request(app.getHttpServer())
				.get(circlesPath(f))
				.query({ skip: 1, take: 1 })
				.set(...asUser(app, f.admin))
				.expect(200);

			expect(circleRows(response.body)).toHaveLength(1);
			expect(circleListMetadata(response.body)).toEqual({
				skip: 1,
				take: 1,
				total: 3,
			});
		});
	});

	/**
	 * GET /programs/:program_id/circles/:circle_id
	 */
	describe('get', () => {
		it('returns the circle', async () => {
			const f = await createProgramWithRoles(dataSource);

			const response = await request(app.getHttpServer())
				.get(`${circlesPath(f)}/${f.defaultCircle.circleId}`)
				.set(...asUser(app, f.admin))
				.expect(200);

			expect(response.body.data).toMatchObject({
				circle_id: f.defaultCircle.circleId,
				name: 'DEFAULT_CIRCLE',
				isDefaultCircle: true,
			});
		});

		it('404s for an unknown circle', async () => {
			const f = await createProgramWithRoles(dataSource);

			await request(app.getHttpServer())
				.get(`${circlesPath(f)}/${UNKNOWN_ID}`)
				.set(...asUser(app, f.admin))
				.expect(404);
		});
	});

	/**
	 * PATCH /programs/:program_id/circles/:circle_id
	 */
	describe('update', () => {
		it('renames a circle', async () => {
			const f = await createProgramWithRoles(dataSource);
			const gold = await createCircle(dataSource, f.program, 'Gold');

			await request(app.getHttpServer())
				.patch(`${circlesPath(f)}/${gold.circleId}`)
				.set(...asUser(app, f.admin))
				.send({ name: 'Platinum' })
				.expect(200);

			const stored = await dataSource
				.getRepository(Circle)
				.findOneByOrFail({ circleId: gold.circleId });
			expect(stored.name).toBe('Platinum');
		});

		it('allows renaming the DEFAULT_CIRCLE without losing its default flag', async () => {
			const f = await createProgramWithRoles(dataSource);

			await request(app.getHttpServer())
				.patch(`${circlesPath(f)}/${f.defaultCircle.circleId}`)
				.set(...asUser(app, f.admin))
				.send({ name: 'Everyone' })
				.expect(200);

			const stored = await dataSource
				.getRepository(Circle)
				.findOneByOrFail({ circleId: f.defaultCircle.circleId });
			expect(stored.name).toBe('Everyone');
			expect(stored.isDefaultCircle).toBe(true);
		});

		it('404s for an unknown circle', async () => {
			const f = await createProgramWithRoles(dataSource);

			await request(app.getHttpServer())
				.patch(`${circlesPath(f)}/${UNKNOWN_ID}`)
				.set(...asUser(app, f.admin))
				.send({ name: 'Nope' })
				.expect(404);
		});

		it('400s on an undeclared property', async () => {
			const f = await createProgramWithRoles(dataSource);

			await request(app.getHttpServer())
				.patch(`${circlesPath(f)}/${f.defaultCircle.circleId}`)
				.set(...asUser(app, f.admin))
				.send({ program_id: f.otherProgram.programId })
				.expect(400);
		});
	});

	/**
	 * DELETE /programs/:program_id/circles/:circle_id
	 */
	describe('delete', () => {
		it('deletes an empty non-default circle', async () => {
			const f = await createProgramWithRoles(dataSource);
			const gold = await createCircle(dataSource, f.program, 'Gold');

			await request(app.getHttpServer())
				.delete(`${circlesPath(f)}/${gold.circleId}`)
				.set(...asUser(app, f.admin))
				.expect(200);

			expect(
				await dataSource
					.getRepository(Circle)
					.existsBy({ circleId: gold.circleId }),
			).toBe(false);

			await request(app.getHttpServer())
				.get(`${circlesPath(f)}/${gold.circleId}`)
				.set(...asUser(app, f.admin))
				.expect(404);
		});
	});

	/**
	 * /programs/:program_id/circles/:circle_id/promoters
	 */
	describe('circle promoters', () => {
		it("lists the circle's promoters with their admin member email", async () => {
			const f = await createProgramWithRoles(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				f.program,
				f.defaultCircle,
			);
			const gold = await createCircle(dataSource, f.program, 'Gold');
			await createPromoter(dataSource, f.program, gold);

			const response = await request(app.getHttpServer())
				.get(`${circlesPath(f)}/${f.defaultCircle.circleId}/promoters`)
				.set(...asUser(app, f.admin))
				.expect(200);

			expect(response.body.data).toMatchObject({
				count: 1,
				skip: 0,
				take: 10,
			});
			expect(response.body.data.items).toHaveLength(1);
			expect(response.body.data.items[0]).toMatchObject({
				promoter_id: promoter.promoterId,
				name: promoter.name,
				admin_member_email: member.email,
			});
		});

		it("filters the circle's promoters by a search query", async () => {
			const f = await createProgramWithRoles(dataSource);
			const { promoter: acme } = await createPromoter(
				dataSource,
				f.program,
				f.defaultCircle,
				{ name: 'Acme Affiliates' },
			);
			await createPromoter(dataSource, f.program, f.defaultCircle, {
				name: 'Zenith Partners',
			});

			const response = await request(app.getHttpServer())
				.get(`${circlesPath(f)}/${f.defaultCircle.circleId}/promoters`)
				.query({ query: 'acm' })
				.set(...asUser(app, f.admin))
				.expect(200);

			expect(
				response.body.data.items.map(
					(p: { promoter_id: string }) => p.promoter_id,
				),
			).toEqual([acme.promoterId]);
		});

		it('adds promoters to a circle', async () => {
			const f = await createProgramWithRoles(dataSource);
			const gold = await createCircle(dataSource, f.program, 'Gold');
			const { promoter: first } = await createPromoter(
				dataSource,
				f.program,
				f.defaultCircle,
			);
			const { promoter: second } = await createPromoter(
				dataSource,
				f.program,
				f.defaultCircle,
			);

			await request(app.getHttpServer())
				.post(`${circlesPath(f)}/${gold.circleId}/promoters`)
				.set(...asUser(app, f.admin))
				.send({ promoters: [first.promoterId, second.promoterId] })
				.expect(201);

			const response = await request(app.getHttpServer())
				.get(`${circlesPath(f)}/${gold.circleId}/promoters`)
				.set(...asUser(app, f.admin))
				.expect(200);

			expect(
				response.body.data.items
					.map((p: { promoter_id: string }) => p.promoter_id)
					.sort(),
			).toEqual([first.promoterId, second.promoterId].sort());
		});

		it('removes a promoter from a circle', async () => {
			const f = await createProgramWithRoles(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				f.program,
				f.defaultCircle,
			);

			await request(app.getHttpServer())
				.delete(
					`${circlesPath(f)}/${f.defaultCircle.circleId}/promoters/${promoter.promoterId}`,
				)
				.set(...asUser(app, f.admin))
				.expect(200);

			expect(
				await dataSource.getRepository(CirclePromoter).existsBy({
					circleId: f.defaultCircle.circleId,
					promoterId: promoter.promoterId,
				}),
			).toBe(false);
		});

		it('400s removing a promoter that is not in the circle', async () => {
			const f = await createProgramWithRoles(dataSource);
			const gold = await createCircle(dataSource, f.program, 'Gold');
			const { promoter } = await createPromoter(
				dataSource,
				f.program,
				f.defaultCircle,
			);

			await request(app.getHttpServer())
				.delete(
					`${circlesPath(f)}/${gold.circleId}/promoters/${promoter.promoterId}`,
				)
				.set(...asUser(app, f.admin))
				.expect(400);
		});

		it('400s when promoters is not an array', async () => {
			const f = await createProgramWithRoles(dataSource);

			await request(app.getHttpServer())
				.post(`${circlesPath(f)}/${f.defaultCircle.circleId}/promoters`)
				.set(...asUser(app, f.admin))
				.send({ promoters: 'not-an-array' })
				.expect(400);
		});

		it('400s on an undeclared property', async () => {
			const f = await createProgramWithRoles(dataSource);

			await request(app.getHttpServer())
				.post(`${circlesPath(f)}/${f.defaultCircle.circleId}/promoters`)
				.set(...asUser(app, f.admin))
				.send({ promoters: [], circle_id: f.defaultCircle.circleId })
				.expect(400);
		});
	});

	/**
	 * Program users: admin and editor manage circles; viewer reads only; a
	 * user with no role in the program is refused outright.
	 */
	describe('authorization: program users', () => {
		type Role = 'admin' | 'editor';

		it.each<Role>(['admin', 'editor'])(
			'%s can create, rename, delete and manage membership',
			async (role) => {
				const f = await createProgramWithRoles(dataSource);
				const header = asUser(app, f[role]);
				const { promoter } = await createPromoter(
					dataSource,
					f.program,
					f.defaultCircle,
				);

				const created = await request(app.getHttpServer())
					.post(circlesPath(f))
					.set(...header)
					.send({ name: 'Gold' })
					.expect(201);
				const circleId = created.body.data.circle_id as string;

				await request(app.getHttpServer())
					.patch(`${circlesPath(f)}/${circleId}`)
					.set(...header)
					.send({ name: 'Platinum' })
					.expect(200);

				await request(app.getHttpServer())
					.post(`${circlesPath(f)}/${circleId}/promoters`)
					.set(...header)
					.send({ promoters: [promoter.promoterId] })
					.expect(201);

				await request(app.getHttpServer())
					.delete(
						`${circlesPath(f)}/${circleId}/promoters/${promoter.promoterId}`,
					)
					.set(...header)
					.expect(200);

				await request(app.getHttpServer())
					.delete(`${circlesPath(f)}/${circleId}`)
					.set(...header)
					.expect(200);
			},
		);

		it('viewer can read circles and their promoters', async () => {
			const f = await createProgramWithRoles(dataSource);
			const header = asUser(app, f.viewer);

			await request(app.getHttpServer())
				.get(circlesPath(f))
				.set(...header)
				.expect(200);
			await request(app.getHttpServer())
				.get(`${circlesPath(f)}/${f.defaultCircle.circleId}`)
				.set(...header)
				.expect(200);
			await request(app.getHttpServer())
				.get(`${circlesPath(f)}/${f.defaultCircle.circleId}/promoters`)
				.set(...header)
				.expect(200);
		});

		it('viewer cannot create, update, delete or change membership', async () => {
			const f = await createProgramWithRoles(dataSource);
			const header = asUser(app, f.viewer);
			const gold = await createCircle(dataSource, f.program, 'Gold');
			const { promoter } = await createPromoter(
				dataSource,
				f.program,
				f.defaultCircle,
			);

			await request(app.getHttpServer())
				.post(circlesPath(f))
				.set(...header)
				.send({ name: 'Nope' })
				.expect(403);
			await request(app.getHttpServer())
				.patch(`${circlesPath(f)}/${gold.circleId}`)
				.set(...header)
				.send({ name: 'Nope' })
				.expect(403);
			await request(app.getHttpServer())
				.post(`${circlesPath(f)}/${gold.circleId}/promoters`)
				.set(...header)
				.send({ promoters: [promoter.promoterId] })
				.expect(403);
			await request(app.getHttpServer())
				.delete(
					`${circlesPath(f)}/${f.defaultCircle.circleId}/promoters/${promoter.promoterId}`,
				)
				.set(...header)
				.expect(403);
			await request(app.getHttpServer())
				.delete(`${circlesPath(f)}/${gold.circleId}`)
				.set(...header)
				.expect(403);

			const stored = await dataSource
				.getRepository(Circle)
				.findOneByOrFail({ circleId: gold.circleId });
			expect(stored.name).toBe('Gold');
			expect(
				await dataSource.getRepository(CirclePromoter).countBy({
					promoterId: promoter.promoterId,
				}),
			).toBe(1);
		});

		it("a user of another program can neither read nor manage this program's circles", async () => {
			const f = await createProgramWithRoles(dataSource);
			const header = asUser(app, f.outsider);

			await request(app.getHttpServer())
				.get(circlesPath(f))
				.set(...header)
				.expect(403);
			await request(app.getHttpServer())
				.get(`${circlesPath(f)}/${f.defaultCircle.circleId}`)
				.set(...header)
				.expect(403);
			await request(app.getHttpServer())
				.post(circlesPath(f))
				.set(...header)
				.send({ name: 'Intruder' })
				.expect(403);
			await request(app.getHttpServer())
				.patch(`${circlesPath(f)}/${f.defaultCircle.circleId}`)
				.set(...header)
				.send({ name: 'Intruder' })
				.expect(403);
			await request(app.getHttpServer())
				.delete(`${circlesPath(f)}/${f.defaultCircle.circleId}`)
				.set(...header)
				.expect(403);

			expect(
				await dataSource
					.getRepository(Circle)
					.countBy({ programId: f.program.programId }),
			).toBe(1);
		});

		it('an inactive program user is refused', async () => {
			const f = await createProgramWithRoles(dataSource);
			const inactive = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				inactive,
				f.program,
				userRoleEnum.ADMIN,
				statusEnum.INACTIVE,
			);

			await request(app.getHttpServer())
				.get(circlesPath(f))
				.set(...asUser(app, inactive))
				.expect(403);
		});

		it("the platform super admin can manage any program's circles", async () => {
			const f = await createProgramWithRoles(dataSource);
			const superAdmin = await seedSuperAdmin(dataSource);

			await request(app.getHttpServer())
				.post(circlesPath(f))
				.set(...asUser(app, superAdmin))
				.send({ name: 'Gold' })
				.expect(201);
		});

		it('rejects a promoter member token', async () => {
			const f = await createProgramWithRoles(dataSource);
			const member = await createMember(dataSource, f.program);

			// Circles resolve their subject from the program-user context, which
			// a member token never carries, so AuthorizationService answers 400
			// before any ability check.
			await request(app.getHttpServer())
				.get(circlesPath(f))
				.set(...asMember(app, member))
				.expect(400);
		});

		it('401s without credentials', async () => {
			const f = await createProgramWithRoles(dataSource);

			await request(app.getHttpServer()).get(circlesPath(f)).expect(401);
		});
	});

	/**
	 * Program API keys get `manage` on their own program's circles
	 * (getApiUserAbility).
	 */
	describe('authorization: program API keys', () => {
		it('can create, list, rename, delete and manage membership', async () => {
			const f = await createProgramWithRoles(dataSource);
			const headers = apiKeyHeaders(
				await createApiKeyCredentials(dataSource, f.program.programId),
			);
			const { promoter } = await createPromoter(
				dataSource,
				f.program,
				f.defaultCircle,
			);

			const created = await request(app.getHttpServer())
				.post(circlesPath(f))
				.set(headers)
				.send({ name: 'Gold' })
				.expect(201);
			const circleId = created.body.data.circle_id as string;

			const list = await request(app.getHttpServer())
				.get(circlesPath(f))
				.set(headers)
				.expect(200);
			expect(circleRows(list.body).map((row) => row.circle_id)).toContain(
				circleId,
			);

			await request(app.getHttpServer())
				.patch(`${circlesPath(f)}/${circleId}`)
				.set(headers)
				.send({ name: 'Platinum' })
				.expect(200);
			await request(app.getHttpServer())
				.post(`${circlesPath(f)}/${circleId}/promoters`)
				.set(headers)
				.send({ promoters: [promoter.promoterId] })
				.expect(201);
			await request(app.getHttpServer())
				.get(`${circlesPath(f)}/${circleId}/promoters`)
				.set(headers)
				.expect(200);
			await request(app.getHttpServer())
				.delete(
					`${circlesPath(f)}/${circleId}/promoters/${promoter.promoterId}`,
				)
				.set(headers)
				.expect(200);
			await request(app.getHttpServer())
				.delete(`${circlesPath(f)}/${circleId}`)
				.set(headers)
				.expect(200);
		});

		it('cannot create circles in another program', async () => {
			const f = await createProgramWithRoles(dataSource);
			const headers = apiKeyHeaders(
				await createApiKeyCredentials(
					dataSource,
					f.otherProgram.programId,
				),
			);

			await request(app.getHttpServer())
				.post(circlesPath(f))
				.set(headers)
				.send({ name: 'Intruder' })
				.expect(403);
		});

		it('a promoter-scoped key cannot read circles', async () => {
			const f = await createProgramWithRoles(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				f.program,
				f.defaultCircle,
			);
			const headers = apiKeyHeaders(
				await createApiKeyCredentials(
					dataSource,
					f.program.programId,
					promoter.promoterId,
				),
			);

			await request(app.getHttpServer())
				.get(circlesPath(f))
				.set(headers)
				.expect(403);
		});
	});
});
