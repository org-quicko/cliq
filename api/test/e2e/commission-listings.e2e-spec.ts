import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import {
	ApiKeyCredentials,
	apiKeyHeaders,
	asMember,
	asUser,
	createApiKeyCredentials,
} from '../support/auth';
import {
	addUserToProgram,
	createCommissionFunction,
	createLink,
	createProgram,
	createPromoter,
	createUser,
	seedSuperAdmin,
	uniqueEmail,
} from '../support/factories';
import {
	ListenerTracker,
	parseCsv,
	trackEventListeners,
	workbookTable,
} from '../support/conversion-helpers';
import { Link, Member, Program, Promoter, User } from '../../src/entities';
import { commissionTypeEnum, triggerEnum, userRoleEnum } from '../../src/enums';
import { MaterializedViewRefreshService } from '../../src/services/materializedViewRefresh.service';

const SHEET_JSON = { 'x-accept-type': 'application/json;format=sheet-json' };

/**
 * Reading conversions back: the program-level listings a program user sees,
 * the promoter-level listings, analytics and CSV reports a promoter member
 * sees, and the tenant boundaries around both.
 *
 * Every test starts from the same activity, generated through the real
 * ingest endpoints so the trigger-maintained referral/analytics tables are
 * populated exactly as in production:
 *
 *   promoter A: signup a1, purchase a1 200, purchase a2 50 (item-2)
 *   promoter B: signup b1
 *
 * with a fixed 10 signup commission and 10% purchase commission, so A earns
 * 10 + 20 + 5 = 35 and B earns 10.
 */
describe('conversion listings and reports (e2e)', () => {
	let app: INestApplication<App>;
	let dataSource: DataSource;
	let listeners: ListenerTracker;

	beforeAll(async () => {
		app = await createTestApp({ http: true });
		dataSource = app.get(DataSource);
		listeners = trackEventListeners(app);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	afterEach(async () => {
		await listeners?.settle();
	});

	interface PromoterSide {
		promoter: Promoter;
		member: Member;
		link: Link;
	}

	interface Activity {
		program: Program;
		admin: User;
		credentials: ApiKeyCredentials;
		a: PromoterSide;
		b: PromoterSide;
		emails: { a1: string; a2: string; b1: string };
	}

	async function seedActivity(): Promise<Activity> {
		const { program, defaultCircle } = await createProgram(dataSource);
		const admin = await createUser(dataSource);
		await addUserToProgram(dataSource, admin, program, userRoleEnum.ADMIN);
		const credentials = await createApiKeyCredentials(
			dataSource,
			program.programId,
		);

		const side = async (): Promise<PromoterSide> => {
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const link = await createLink(dataSource, program, promoter);
			return { promoter, member, link };
		};
		const a = await side();
		const b = await side();

		await createCommissionFunction(dataSource, program, defaultCircle, {
			trigger: triggerEnum.SIGNUP,
			commissionType: commissionTypeEnum.FIXED,
			commissionValue: 10,
		});
		await createCommissionFunction(dataSource, program, defaultCircle, {
			trigger: triggerEnum.PURCHASE,
			commissionType: commissionTypeEnum.PERCENTAGE,
			commissionValue: 10,
		});

		const emails = {
			a1: uniqueEmail('a1'),
			a2: uniqueEmail('a2'),
			b1: uniqueEmail('b1'),
		};
		const post = async (path: string, body: Record<string, unknown>) => {
			await request(app.getHttpServer())
				.post(path)
				.set(apiKeyHeaders(credentials))
				.send(body)
				.expect(201);
			await listeners.settle();
		};

		await post('/api/signups', {
			ref_val: a.link.refVal,
			email: emails.a1,
			first_name: 'Ada',
		});
		await post('/api/purchases', {
			ref_val: a.link.refVal,
			email: emails.a1,
			amount: 200,
			item_id: 'item-1',
		});
		await post('/api/purchases', {
			ref_val: a.link.refVal,
			email: emails.a2,
			amount: 50,
			item_id: 'item-2',
		});
		await post('/api/signups', {
			ref_val: b.link.refVal,
			email: emails.b1,
		});

		return { program, admin, credentials, a, b, emails };
	}

	const url = (path: string) => `/api${path}`;

	const promoterPath = (s: Activity, side: PromoterSide, suffix: string) =>
		`/programs/${s.program.programId}/promoters/${side.promoter.promoterId}/${suffix}`;

	describe('program level', () => {
		it('lists every commission in the program, filterable by conversion type', async () => {
			const s = await seedActivity();

			const all = await request(app.getHttpServer())
				.get(url(`/programs/${s.program.programId}/commissions`))
				.set(...asUser(app, s.admin))
				.expect(200);
			expect(all.body.data).toHaveLength(4);

			const purchases = await request(app.getHttpServer())
				.get(
					url(
						`/programs/${s.program.programId}/commissions?conversion_type=purchase`,
					),
				)
				.set(...asUser(app, s.admin))
				.expect(200);
			const amounts = purchases.body.data.map(
				(c: { amount: number }) => c.amount,
			);
			expect(amounts.sort((x: number, y: number) => x - y)).toEqual([
				5, 20,
			]);
			for (const c of purchases.body.data) {
				expect(c.conversion_type).toBe('purchase');
			}
		});

		it('lists purchases, filterable by item', async () => {
			const s = await seedActivity();

			const all = await request(app.getHttpServer())
				.get(url(`/programs/${s.program.programId}/purchases`))
				.set(...asUser(app, s.admin))
				.expect(200);
			expect(all.body.data).toHaveLength(2);
			for (const p of all.body.data) {
				expect(p.promoter_id).toBe(s.a.promoter.promoterId);
			}

			const filtered = await request(app.getHttpServer())
				.get(
					url(
						`/programs/${s.program.programId}/purchases?item_id=item-2`,
					),
				)
				.set(...asUser(app, s.admin))
				.expect(200);
			expect(filtered.body.data).toHaveLength(1);
			expect(filtered.body.data[0]).toMatchObject({
				amount: 50,
				item_id: 'item-2',
			});
		});

		it('lists signups across promoters', async () => {
			const s = await seedActivity();

			const response = await request(app.getHttpServer())
				.get(url(`/programs/${s.program.programId}/signups`))
				.set(...asUser(app, s.admin))
				.expect(200);

			const promoterIds = response.body.data.map(
				(x: { promoter_id: string }) => x.promoter_id,
			);
			expect(promoterIds.sort()).toEqual(
				[s.a.promoter.promoterId, s.b.promoter.promoterId].sort(),
			);
		});

		it('lists referrals with their running totals', async () => {
			const s = await seedActivity();

			const response = await request(app.getHttpServer())
				.get(
					url(
						`/programs/${s.program.programId}/referrals?sort_by=updatedAt`,
					),
				)
				.set(...asUser(app, s.admin))
				.expect(200);

			expect(response.body.data.count).toBe(3);
			const items = response.body.data.items as {
				contact_info: string;
			}[];
			const byContact = Object.fromEntries(
				items.map((r) => [r.contact_info, r]),
			);
			expect(byContact[s.emails.a1]).toMatchObject({
				promoter_id: s.a.promoter.promoterId,
				promoter_name: s.a.promoter.name,
				total_revenue: 200,
				total_commission: 30,
				status: 'active',
			});
			expect(byContact[s.emails.a2]).toMatchObject({
				total_revenue: 50,
				total_commission: 5,
			});
			expect(byContact[s.emails.b1]).toMatchObject({
				promoter_id: s.b.promoter.promoterId,
				total_revenue: 0,
				total_commission: 10,
				status: 'lead',
			});
		});

		it("summarises one promoter's analytics for a program user", async () => {
			const s = await seedActivity();

			const response = await request(app.getHttpServer())
				.get(url(promoterPath(s, s.a, 'summary')))
				.set(...asUser(app, s.admin))
				.expect(200);

			const [totals] = workbookTable(
				response.body,
				'promoter_analytics_table',
			);
			expect(totals).toMatchObject({
				promoter_id: s.a.promoter.promoterId,
				total_signups: 1,
				total_purchases: 2,
				total_revenue: 250,
				total_commission: 35,
				signup_commission: 10,
				purchase_commission: 25,
			});
		});

		it('is readable by a viewer and by the program API key', async () => {
			const s = await seedActivity();
			const viewer = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				viewer,
				s.program,
				userRoleEnum.VIEWER,
			);

			await request(app.getHttpServer())
				.get(url(`/programs/${s.program.programId}/commissions`))
				.set(...asUser(app, viewer))
				.expect(200);
			const viaKey = await request(app.getHttpServer())
				.get(url(`/programs/${s.program.programId}/commissions`))
				.set(apiKeyHeaders(s.credentials))
				.expect(200);
			expect(viaKey.body.data).toHaveLength(4);
		});

		it("streams the program's promoter report as CSV", async () => {
			const s = await seedActivity();

			const response = await request(app.getHttpServer())
				.get(url(`/programs/${s.program.programId}/report`))
				.set(...asUser(app, s.admin))
				.set(SHEET_JSON)
				.expect(200);

			expect(response.headers['content-type']).toMatch(/^text\/csv/);
			expect(response.headers['content-disposition']).toMatch(
				/^attachment; filename=".+\.csv"$/,
			);
			const rows = parseCsv(response.text);
			const byPromoter = Object.fromEntries(
				rows.map((r) => [r.promoter_id, r]),
			);
			expect(
				Number(byPromoter[s.a.promoter.promoterId].total_commission),
			).toBe(35);
			expect(
				Number(byPromoter[s.a.promoter.promoterId].total_revenue),
			).toBe(250);
			expect(
				Number(byPromoter[s.b.promoter.promoterId].total_signups),
			).toBe(1);
		});

		it('400s on the program report without the sheet-json accept type', async () => {
			const s = await seedActivity();

			await request(app.getHttpServer())
				.get(url(`/programs/${s.program.programId}/report`))
				.set(...asUser(app, s.admin))
				.expect(400);
		});
	});

	describe('program boundaries', () => {
		it.each([
			'commissions',
			'purchases',
			'signups',
			'referrals?sort_by=updatedAt',
		])("a user of another program can't read /%s", async (suffix) => {
			const s = await seedActivity();
			const { program: otherProgram } = await createProgram(dataSource);
			const outsider = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				outsider,
				otherProgram,
				userRoleEnum.ADMIN,
			);

			await request(app.getHttpServer())
				.get(url(`/programs/${s.program.programId}/${suffix}`))
				.set(...asUser(app, outsider))
				.expect(403);
		});

		it("another program's API key can't read this program's commissions", async () => {
			const s = await seedActivity();
			const { program: otherProgram } = await createProgram(dataSource);
			const otherKey = await createApiKeyCredentials(
				dataSource,
				otherProgram.programId,
			);

			await request(app.getHttpServer())
				.get(url(`/programs/${s.program.programId}/commissions`))
				.set(apiKeyHeaders(otherKey))
				.expect(403);
		});

		it("a user can't reach another program's promoter through their own program", async () => {
			const s = await seedActivity();
			const { program: otherProgram } = await createProgram(dataSource);
			const outsider = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				outsider,
				otherProgram,
				userRoleEnum.ADMIN,
			);

			const response = await request(app.getHttpServer())
				.get(
					url(
						`/programs/${otherProgram.programId}/promoters/${s.a.promoter.promoterId}/commissions`,
					),
				)
				.set(...asUser(app, outsider));

			expect(response.status).toBeGreaterThanOrEqual(400);
			expect(response.status).toBeLessThan(500);
		});
	});

	describe('promoter level', () => {
		it("lists the promoter's own commissions only", async () => {
			const s = await seedActivity();

			const response = await request(app.getHttpServer())
				.get(url(promoterPath(s, s.a, 'commissions')))
				.set(...asMember(app, s.a.member))
				.expect(200);

			const amounts = response.body.data.map(
				(c: { amount: number }) => c.amount,
			);
			expect(amounts.sort((x: number, y: number) => x - y)).toEqual([
				5, 10, 20,
			]);

			const signUpsOnly = await request(app.getHttpServer())
				.get(
					url(
						promoterPath(
							s,
							s.a,
							'commissions?conversion_type=signup',
						),
					),
				)
				.set(...asMember(app, s.a.member))
				.expect(200);
			expect(signUpsOnly.body.data).toHaveLength(1);
			expect(signUpsOnly.body.data[0]).toMatchObject({
				conversion_type: 'signup',
				amount: 10,
			});
		});

		it('returns commissions as a workbook with the referral and revenue', async () => {
			const s = await seedActivity();

			const response = await request(app.getHttpServer())
				.get(url(promoterPath(s, s.a, 'commissions')))
				.set(...asMember(app, s.a.member))
				.set(SHEET_JSON)
				.expect(200);

			const rows = workbookTable(response.body, 'commission_table');
			expect(rows).toHaveLength(3);
			expect(rows).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						referral: s.emails.a1,
						conversion_type: 'purchase',
						commission: 20,
						revenue: 200,
						link_id: s.a.link.linkId,
					}),
					expect.objectContaining({
						referral: s.emails.a1,
						conversion_type: 'signup',
						commission: 10,
						revenue: 0,
					}),
				]),
			);
		});

		it('lists purchases, filterable by item', async () => {
			const s = await seedActivity();

			const all = await request(app.getHttpServer())
				.get(url(promoterPath(s, s.a, 'purchases')))
				.set(...asMember(app, s.a.member))
				.expect(200);
			const rows = workbookTable(all.body, 'purchase_table');
			expect(rows).toHaveLength(2);
			expect(rows.map((r) => r.amount)).toEqual(
				expect.arrayContaining([200, 50]),
			);

			const filtered = await request(app.getHttpServer())
				.get(url(promoterPath(s, s.a, 'purchases?item_id=item-2')))
				.set(...asMember(app, s.a.member))
				.expect(200);
			expect(workbookTable(filtered.body, 'purchase_table')).toEqual([
				expect.objectContaining({ amount: 50, item_id: 'item-2' }),
			]);
		});

		it('lists signups with the contact email masked', async () => {
			const s = await seedActivity();

			const response = await request(app.getHttpServer())
				.get(url(promoterPath(s, s.a, 'signups')))
				.set(...asMember(app, s.a.member))
				.expect(200);

			const rows = workbookTable(response.body, 'signup_table');
			expect(rows).toHaveLength(1);
			expect(rows[0]).toMatchObject({
				first_name: 'Ada',
				link_id: s.a.link.linkId,
			});
			expect(rows[0].email).not.toBe(s.emails.a1);
			expect(rows[0].email).toMatch(/\*+@test\.local$/);
		});

		it('lists referrals with their totals', async () => {
			const s = await seedActivity();

			const response = await request(app.getHttpServer())
				.get(url(promoterPath(s, s.a, 'referrals')))
				.set(...asMember(app, s.a.member))
				.expect(200);

			expect(response.body.data.count).toBe(2);
			const totals = response.body.data.items
				.map(
					(r: {
						total_revenue: number;
						total_commission: number;
					}) => [r.total_revenue, r.total_commission],
				)
				.sort((x: number[], y: number[]) => x[0] - y[0]);
			expect(totals).toEqual([
				[50, 5],
				[200, 30],
			]);
		});

		it('reports the promoter analytics totals', async () => {
			const s = await seedActivity();

			const response = await request(app.getHttpServer())
				.get(url(promoterPath(s, s.a, 'analytics')))
				.set(...asMember(app, s.a.member))
				.set(SHEET_JSON)
				.expect(200);

			const [totals] = workbookTable(
				response.body,
				'promoter_analytics_table',
			);
			expect(totals).toMatchObject({
				total_signups: 1,
				total_purchases: 2,
				total_revenue: 250,
				total_commission: 35,
			});
		});

		it('summarises the promoter for its own member', async () => {
			const s = await seedActivity();

			const response = await request(app.getHttpServer())
				.get(url(promoterPath(s, s.b, 'summary')))
				.set(...asMember(app, s.b.member))
				.expect(200);

			const [totals] = workbookTable(
				response.body,
				'promoter_analytics_table',
			);
			expect(totals).toMatchObject({
				total_signups: 1,
				total_purchases: 0,
				total_commission: 10,
			});
		});

		it("a promoter-scoped API key reads its own promoter's commissions", async () => {
			const s = await seedActivity();
			const key = await createApiKeyCredentials(
				dataSource,
				s.program.programId,
				s.a.promoter.promoterId,
			);

			const response = await request(app.getHttpServer())
				.get(url(promoterPath(s, s.a, 'commissions')))
				.set(apiKeyHeaders(key))
				.expect(200);
			expect(response.body.data).toHaveLength(3);
		});
	});

	describe('promoter boundaries', () => {
		it.each([
			'commissions',
			'purchases',
			'signups',
			'referrals',
			'analytics',
			'summary',
			'reports/signups',
			'reports/purchases',
			'reports/referrals',
		])(
			"a member of promoter A can't read promoter B's /%s",
			async (suffix) => {
				const s = await seedActivity();

				await request(app.getHttpServer())
					.get(url(promoterPath(s, s.b, suffix)))
					.set(...asMember(app, s.a.member))
					.set(SHEET_JSON)
					.expect(403);
			},
		);

		it("a promoter-scoped API key can't read another promoter's commissions", async () => {
			const s = await seedActivity();
			const key = await createApiKeyCredentials(
				dataSource,
				s.program.programId,
				s.a.promoter.promoterId,
			);

			await request(app.getHttpServer())
				.get(url(promoterPath(s, s.b, 'commissions')))
				.set(apiKeyHeaders(key))
				.expect(403);
		});
	});

	describe('promoter reports', () => {
		const expectCsvAttachment = (
			response: request.Response,
			fileName: string,
		) => {
			expect(response.headers['content-type']).toMatch(/^text\/csv/);
			expect(response.headers['content-disposition']).toBe(
				`attachment; filename="${fileName}"`,
			);
		};

		it('streams signups as CSV', async () => {
			const s = await seedActivity();

			const response = await request(app.getHttpServer())
				.get(url(promoterPath(s, s.a, 'reports/signups')))
				.set(...asMember(app, s.a.member))
				.set(SHEET_JSON)
				.expect(200);

			expectCsvAttachment(response, 'Signups Report.csv');
			const rows = parseCsv(response.text);
			expect(rows).toHaveLength(1);
			expect(rows[0].email).toBe(s.emails.a1);
		});

		it('streams purchases as CSV', async () => {
			const s = await seedActivity();

			const response = await request(app.getHttpServer())
				.get(url(promoterPath(s, s.a, 'reports/purchases')))
				.set(...asMember(app, s.a.member))
				.set(SHEET_JSON)
				.expect(200);

			expectCsvAttachment(response, 'Purchases Report.csv');
			const rows = parseCsv(response.text);
			expect(rows).toHaveLength(2);
			expect(rows.map((r) => [r.item_id, Number(r.amount)])).toEqual(
				expect.arrayContaining([
					['item-1', 200],
					['item-2', 50],
				]),
			);
		});

		it('streams links as CSV', async () => {
			const s = await seedActivity();

			const response = await request(app.getHttpServer())
				.get(url(promoterPath(s, s.a, 'reports/links')))
				.set(...asMember(app, s.a.member))
				.set(SHEET_JSON)
				.expect(200);

			expect(response.headers['content-type']).toMatch(/^text\/csv/);
			expect(response.headers['content-disposition']).toMatch(
				/^attachment; filename=".+\.csv"$/,
			);
			const rows = parseCsv(response.text);
			expect(rows).toHaveLength(1);
			expect(rows[0]).toMatchObject({
				link_id: s.a.link.linkId,
				signups: '1',
				purchases: '2',
				commission: '35',
			});
		});

		it('streams referrals as CSV', async () => {
			const s = await seedActivity();

			const response = await request(app.getHttpServer())
				.get(url(promoterPath(s, s.a, 'reports/referrals')))
				.set(...asMember(app, s.a.member))
				.set(SHEET_JSON)
				.expect(200);

			expect(response.headers['content-type']).toMatch(/^text\/csv/);
			expect(response.headers['content-disposition']).toMatch(
				/^attachment; filename=".+\.csv"$/,
			);
			expect(parseCsv(response.text)).toHaveLength(2);
		});

		it.each(['signups', 'purchases', 'links', 'referrals'])(
			'400s on reports/%s without the sheet-json accept type',
			async (report) => {
				const s = await seedActivity();

				await request(app.getHttpServer())
					.get(url(promoterPath(s, s.a, `reports/${report}`)))
					.set(...asMember(app, s.a.member))
					.expect(400);
			},
		);
	});

	describe('program summary materialized view', () => {
		// program_summary_mv is a real materialized view that only the (in
		// tests, disabled) cron refreshes. Its total_promoters column is left
		// unasserted: it counts only promoters with referrals, which is a
		// known, deferred discrepancy.
		it('picks up referrals once MaterializedViewRefreshService refreshes it', async () => {
			const s = await seedActivity();
			const superAdmin = await seedSuperAdmin(dataSource);
			const summaryRows = async () => {
				const response = await request(app.getHttpServer())
					.get(
						url(
							`/programs/summary?program_id=${s.program.programId}`,
						),
					)
					.set(...asUser(app, superAdmin))
					.expect(200);
				return workbookTable(
					response.body,
					'program_summary_view_table',
				);
			};

			expect(await summaryRows()).toHaveLength(0);

			await app
				.get(MaterializedViewRefreshService)
				.refreshMaterializedViews();

			const rows = await summaryRows();
			expect(rows).toHaveLength(1);
			expect(rows[0]).toMatchObject({
				program_id: s.program.programId,
				program_name: s.program.name,
				total_referrals: 3,
			});
		});
	});
});
