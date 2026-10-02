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
	createLink,
	createProgram,
	createPromoter,
	createUser,
} from '../support/factories';
import { workbookRows, workbookTable } from '../support/promoter-helpers';
import { Link } from '../../src/entities';
import { linkStatusEnum, memberRoleEnum, userRoleEnum } from '../../src/enums';

/**
 * Referral links belong to one promoter inside one program. Promoter admins
 * and editors manage them, viewers read them; program admins/editors manage
 * links of any promoter in their program; API keys follow their program or
 * promoter scope. `ref_val` is unique per program. "Deleting" a link
 * (PATCH) archives it.
 */
describe('links (e2e)', () => {
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

	const linksUrl = (programId: string, promoterId: string) =>
		`/api/programs/${programId}/promoters/${promoterId}/links`;

	const findLink = (refVal: string, programId: string) =>
		dataSource.getRepository(Link).findOneBy({ refVal, programId });

	describe('POST /programs/:program_id/promoters/:promoter_id/links', () => {
		it.each([memberRoleEnum.ADMIN, memberRoleEnum.EDITOR])(
			'lets a promoter %s create a link, answering with its analytics row',
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

				const response = await request(app.getHttpServer())
					.post(linksUrl(program.programId, promoter.promoterId))
					.set(...asMember(app, member))
					.send({ name: 'Newsletter', ref_val: 'newsletter' })
					.expect(201);

				const rows = workbookRows(
					response.body.data,
					'link_analytics_table',
				);
				expect(rows).toHaveLength(1);
				expect(rows[0]).toMatchObject({
					link_name: 'Newsletter',
					ref_val: 'newsletter',
					promoter_id: promoter.promoterId,
					signups: 0,
					purchases: 0,
					commission: 0,
				});

				const stored = await findLink('newsletter', program.programId);
				expect(stored).toMatchObject({
					linkId: rows[0].link_id,
					name: 'Newsletter',
					promoterId: promoter.promoterId,
					status: linkStatusEnum.ACTIVE,
				});
			},
		);

		it('403s for a promoter viewer', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
				{
					memberRole: memberRoleEnum.VIEWER,
				},
			);

			await request(app.getHttpServer())
				.post(linksUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, member))
				.send({ name: 'Nope', ref_val: 'viewer-link' })
				.expect(403);

			expect(await findLink('viewer-link', program.programId)).toBeNull();
		});

		it('409s on a ref_val already used in the program, even by another promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const { promoter: sibling } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			await createLink(dataSource, program, sibling, 'taken');

			await request(app.getHttpServer())
				.post(linksUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, member))
				.send({ name: 'Dup', ref_val: 'taken' })
				.expect(409);

			expect(
				await dataSource
					.getRepository(Link)
					.countBy({ refVal: 'taken', programId: program.programId }),
			).toBe(1);
		});

		it('allows the same ref_val in a different program', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { program: otherProgram, defaultCircle: otherCircle } =
				await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const { promoter: elsewhere } = await createPromoter(
				dataSource,
				otherProgram,
				otherCircle,
			);
			await createLink(dataSource, otherProgram, elsewhere, 'shared');

			await request(app.getHttpServer())
				.post(linksUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, member))
				.send({ name: 'Shared', ref_val: 'shared' })
				.expect(201);
		});

		it.each([
			['a missing ref_val', { name: 'No ref' }],
			['a missing name', { ref_val: 'no-name' }],
			[
				'an unknown status',
				{ name: 'Bad', ref_val: 'bad-status', status: 'deleted' },
			],
			[
				'an undeclared property',
				{ name: 'Bad', ref_val: 'bad-prop', promoter_id: 'x' },
			],
		])('rejects %s', async (_label, body) => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await request(app.getHttpServer())
				.post(linksUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, member))
				.send(body)
				.expect(400);
		});

		it('403s for the admin of another promoter', async () => {
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
				.post(linksUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, outsider))
				.send({ name: 'Planted', ref_val: 'planted' })
				.expect(403);

			expect(await findLink('planted', program.programId)).toBeNull();
		});

		it.each([userRoleEnum.ADMIN, userRoleEnum.EDITOR])(
			'lets a program %s create a link for a promoter of their program',
			async (role) => {
				const { program, defaultCircle } =
					await createProgram(dataSource);
				const { promoter } = await createPromoter(
					dataSource,
					program,
					defaultCircle,
				);
				const user = await createUser(dataSource);
				await addUserToProgram(dataSource, user, program, role);

				await request(app.getHttpServer())
					.post(linksUrl(program.programId, promoter.promoterId))
					.set(...asUser(app, user))
					.send({ name: 'By staff', ref_val: `staff-${role}` })
					.expect(201);

				const stored = await findLink(
					`staff-${role}`,
					program.programId,
				);
				expect(stored?.promoterId).toBe(promoter.promoterId);
			},
		);

		it('403s for a program viewer and for an admin of another program', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { program: otherProgram } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const viewer = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				viewer,
				program,
				userRoleEnum.VIEWER,
			);
			const foreignAdmin = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				foreignAdmin,
				otherProgram,
				userRoleEnum.ADMIN,
			);

			for (const user of [viewer, foreignAdmin]) {
				await request(app.getHttpServer())
					.post(linksUrl(program.programId, promoter.promoterId))
					.set(...asUser(app, user))
					.send({ name: 'Nope', ref_val: 'staff-nope' })
					.expect(403);
			}
			expect(await findLink('staff-nope', program.programId)).toBeNull();
		});

		it('lets a program API key create links, but not a promoter-scoped key', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const programKey = await createApiKeyCredentials(
				dataSource,
				program.programId,
			);
			const promoterKey = await createApiKeyCredentials(
				dataSource,
				program.programId,
				promoter.promoterId,
			);

			await request(app.getHttpServer())
				.post(linksUrl(program.programId, promoter.promoterId))
				.set(apiKeyHeaders(programKey))
				.send({ name: 'Via key', ref_val: 'program-key' })
				.expect(201);

			await request(app.getHttpServer())
				.post(linksUrl(program.programId, promoter.promoterId))
				.set(apiKeyHeaders(promoterKey))
				.send({ name: 'Via key', ref_val: 'promoter-key' })
				.expect(403);

			expect(
				await findLink('program-key', program.programId),
			).not.toBeNull();
			expect(
				await findLink('promoter-key', program.programId),
			).toBeNull();
		});
	});

	describe('GET /programs/:program_id/promoters/:promoter_id/links', () => {
		it("lists only this promoter's active links, to any of its members", async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
				{
					memberRole: memberRoleEnum.VIEWER,
				},
			);
			const { promoter: sibling } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const active = await createLink(
				dataSource,
				program,
				promoter,
				'active',
			);
			const archived = await createLink(
				dataSource,
				program,
				promoter,
				'archived',
			);
			await dataSource
				.getRepository(Link)
				.update(
					{ linkId: archived.linkId },
					{ status: linkStatusEnum.ARCHIVED },
				);
			await createLink(dataSource, program, sibling, 'sibling');

			const response = await request(app.getHttpServer())
				.get(linksUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, member))
				.expect(200);

			expect(response.body.data).toEqual([
				expect.objectContaining({
					link_id: active.linkId,
					name: active.name,
					ref_val: 'active',
				}),
			]);
		});

		it('filters by exact name when `name` is given, and lists everything when omitted', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const repo = dataSource.getRepository(Link);
			const [blog, video] = await repo.save([
				repo.create({
					name: 'Blog',
					refVal: 'blog',
					programId: program.programId,
					promoterId: promoter.promoterId,
				}),
				repo.create({
					name: 'Video',
					refVal: 'video',
					programId: program.programId,
					promoterId: promoter.promoterId,
				}),
			]);

			const all = await request(app.getHttpServer())
				.get(linksUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, member))
				.expect(200);
			expect(
				all.body.data.map((l: { link_id: string }) => l.link_id).sort(),
			).toEqual([blog.linkId, video.linkId].sort());

			const filtered = await request(app.getHttpServer())
				.get(linksUrl(program.programId, promoter.promoterId))
				.query({ name: 'Blog' })
				.set(...asMember(app, member))
				.expect(200);
			expect(
				filtered.body.data.map((l: { link_id: string }) => l.link_id),
			).toEqual([blog.linkId]);

			// The service treats an empty result as "not found".
			await request(app.getHttpServer())
				.get(linksUrl(program.programId, promoter.promoterId))
				.query({ name: 'Blo' })
				.set(...asMember(app, member))
				.expect(404);
		});

		it('pages with skip and take', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			for (const refVal of ['p1', 'p2', 'p3']) {
				await createLink(dataSource, program, promoter, refVal);
			}

			const firstPage = await request(app.getHttpServer())
				.get(linksUrl(program.programId, promoter.promoterId))
				.query({ skip: 0, take: 2 })
				.set(...asMember(app, member))
				.expect(200);
			const secondPage = await request(app.getHttpServer())
				.get(linksUrl(program.programId, promoter.promoterId))
				.query({ skip: 2, take: 2 })
				.set(...asMember(app, member))
				.expect(200);

			expect(firstPage.body.data).toHaveLength(2);
			expect(secondPage.body.data).toHaveLength(1);
			const seen = [...firstPage.body.data, ...secondPage.body.data].map(
				(l: { ref_val: string }) => l.ref_val,
			);
			expect(seen.sort()).toEqual(['p1', 'p2', 'p3']);
		});

		it('403s for a member of another promoter', async () => {
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
			await createLink(dataSource, program, promoter);

			await request(app.getHttpServer())
				.get(linksUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, outsider))
				.expect(403);
		});

		it('is readable by a program viewer, but not by a user outside the program', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const link = await createLink(dataSource, program, promoter);
			const viewer = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				viewer,
				program,
				userRoleEnum.VIEWER,
			);
			const outsider = await createUser(dataSource);

			const response = await request(app.getHttpServer())
				.get(linksUrl(program.programId, promoter.promoterId))
				.set(...asUser(app, viewer))
				.expect(200);
			expect(
				response.body.data.map((l: { link_id: string }) => l.link_id),
			).toEqual([link.linkId]);

			await request(app.getHttpServer())
				.get(linksUrl(program.programId, promoter.promoterId))
				.set(...asUser(app, outsider))
				.expect(403);
		});

		it("scopes a promoter API key to its own promoter's links", async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const { promoter: sibling } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const link = await createLink(dataSource, program, promoter);
			await createLink(dataSource, program, sibling);
			const credentials = await createApiKeyCredentials(
				dataSource,
				program.programId,
				promoter.promoterId,
			);

			const response = await request(app.getHttpServer())
				.get(linksUrl(program.programId, promoter.promoterId))
				.set(apiKeyHeaders(credentials))
				.expect(200);
			expect(
				response.body.data.map((l: { link_id: string }) => l.link_id),
			).toEqual([link.linkId]);

			await request(app.getHttpServer())
				.get(linksUrl(program.programId, sibling.promoterId))
				.set(apiKeyHeaders(credentials))
				.expect(403);
		});

		it('scopes a program API key to its own program', async () => {
			const { program } = await createProgram(dataSource);
			const { program: otherProgram, defaultCircle: otherCircle } =
				await createProgram(dataSource);
			const { promoter: foreign } = await createPromoter(
				dataSource,
				otherProgram,
				otherCircle,
			);
			await createLink(dataSource, otherProgram, foreign);
			const credentials = await createApiKeyCredentials(
				dataSource,
				program.programId,
			);

			await request(app.getHttpServer())
				.get(linksUrl(otherProgram.programId, foreign.promoterId))
				.set(apiKeyHeaders(credentials))
				.expect(403);
		});
	});

	describe('GET /programs/:program_id/promoters/:promoter_id/links/:link_id', () => {
		it('returns the link', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
				{
					memberRole: memberRoleEnum.VIEWER,
				},
			);
			const link = await createLink(
				dataSource,
				program,
				promoter,
				'single',
			);

			const response = await request(app.getHttpServer())
				.get(
					`${linksUrl(program.programId, promoter.promoterId)}/${link.linkId}`,
				)
				.set(...asMember(app, member))
				.expect(200);

			expect(response.body.data).toMatchObject({
				link_id: link.linkId,
				name: link.name,
				ref_val: 'single',
			});
		});

		it('404s for an unknown link', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await request(app.getHttpServer())
				.get(
					`${linksUrl(program.programId, promoter.promoterId)}/00000000-0000-4000-8000-000000000000`,
				)
				.set(...asMember(app, member))
				.expect(404);
		});

		it('403s for a member of another promoter addressing that promoter', async () => {
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
			const link = await createLink(dataSource, program, promoter);

			await request(app.getHttpServer())
				.get(
					`${linksUrl(program.programId, promoter.promoterId)}/${link.linkId}`,
				)
				.set(...asMember(app, outsider))
				.expect(403);
		});
	});

	describe('PATCH /programs/:program_id/promoters/:promoter_id/links/:link_id (archive)', () => {
		it.each([memberRoleEnum.ADMIN, memberRoleEnum.EDITOR])(
			'lets a promoter %s archive a link, which then drops out of the list',
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
				const doomed = await createLink(
					dataSource,
					program,
					promoter,
					'doomed',
				);
				const kept = await createLink(
					dataSource,
					program,
					promoter,
					'kept',
				);

				await request(app.getHttpServer())
					.patch(
						`${linksUrl(program.programId, promoter.promoterId)}/${doomed.linkId}`,
					)
					.set(...asMember(app, member))
					.expect(200);

				const stored = await dataSource
					.getRepository(Link)
					.findOneByOrFail({ linkId: doomed.linkId });
				expect(stored.status).toBe(linkStatusEnum.ARCHIVED);

				const list = await request(app.getHttpServer())
					.get(linksUrl(program.programId, promoter.promoterId))
					.set(...asMember(app, member))
					.expect(200);
				expect(
					list.body.data.map((l: { link_id: string }) => l.link_id),
				).toEqual([kept.linkId]);
			},
		);

		it('403s for a promoter viewer', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
				{
					memberRole: memberRoleEnum.VIEWER,
				},
			);
			const link = await createLink(dataSource, program, promoter);

			await request(app.getHttpServer())
				.patch(
					`${linksUrl(program.programId, promoter.promoterId)}/${link.linkId}`,
				)
				.set(...asMember(app, member))
				.expect(403);

			const stored = await dataSource
				.getRepository(Link)
				.findOneByOrFail({ linkId: link.linkId });
			expect(stored.status).toBe(linkStatusEnum.ACTIVE);
		});

		it('403s for a member of another promoter addressing that promoter', async () => {
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
			const link = await createLink(dataSource, program, promoter);

			await request(app.getHttpServer())
				.patch(
					`${linksUrl(program.programId, promoter.promoterId)}/${link.linkId}`,
				)
				.set(...asMember(app, outsider))
				.expect(403);

			const stored = await dataSource
				.getRepository(Link)
				.findOneByOrFail({ linkId: link.linkId });
			expect(stored.status).toBe(linkStatusEnum.ACTIVE);
		});
	});

	describe('link analytics', () => {
		it("GET .../link_analytics returns this promoter's links as a workbook", async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const { promoter: sibling } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const link = await createLink(
				dataSource,
				program,
				promoter,
				'mine',
			);
			await createLink(dataSource, program, sibling, 'theirs');

			const response = await request(app.getHttpServer())
				.get(
					`/api/programs/${program.programId}/promoters/${promoter.promoterId}/link_analytics`,
				)
				.query({ sort_by: 'createdAt' })
				.set('x-accept-type', 'application/json;format=sheet-json')
				.set(...asMember(app, member))
				.expect(200);

			const table = workbookTable(
				response.body.data,
				'link_analytics_table',
			);
			expect(table.metadata).toMatchObject({
				programId: program.programId,
				count: 1,
			});
			expect(
				workbookRows(response.body.data, 'link_analytics_table'),
			).toEqual([
				expect.objectContaining({
					link_id: link.linkId,
					ref_val: 'mine',
					promoter_id: promoter.promoterId,
					signups: 0,
					purchases: 0,
					commission: 0,
				}),
			]);
		});

		it("GET .../links-summary returns this promoter's links for the period", async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
				{
					memberRole: memberRoleEnum.VIEWER,
				},
			);
			const { promoter: sibling } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const link = await createLink(
				dataSource,
				program,
				promoter,
				'summary',
			);
			await createLink(dataSource, program, sibling, 'not-mine');

			const response = await request(app.getHttpServer())
				.get(
					`/api/programs/${program.programId}/promoters/${promoter.promoterId}/links-summary`,
				)
				.set(...asMember(app, member))
				.expect(200);

			const table = workbookTable(
				response.body.data,
				'link_analytics_table',
			);
			expect(table.metadata).toMatchObject({
				period: '30days',
				count: 1,
				hasMore: false,
			});
			expect(
				workbookRows(response.body.data, 'link_analytics_table'),
			).toEqual([
				expect.objectContaining({
					link_id: link.linkId,
					ref_val: 'summary',
				}),
			]);
		});

		it('403s both analytics endpoints for a member of another promoter', async () => {
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
			await createLink(dataSource, program, promoter);
			const base = `/api/programs/${program.programId}/promoters/${promoter.promoterId}`;

			await request(app.getHttpServer())
				.get(`${base}/link_analytics`)
				.query({ sort_by: 'createdAt' })
				.set('x-accept-type', 'application/json;format=sheet-json')
				.set(...asMember(app, outsider))
				.expect(403);

			await request(app.getHttpServer())
				.get(`${base}/links-summary`)
				.set(...asMember(app, outsider))
				.expect(403);
		});
	});
});
