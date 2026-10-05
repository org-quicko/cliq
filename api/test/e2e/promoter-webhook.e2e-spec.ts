import {
	describe,
	it,
	expect,
	beforeAll,
	beforeEach,
	afterAll,
	vi,
} from 'vitest';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp, truncateAll } from '../support/test-app';
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
	createLink,
	createMember,
	createProgram,
	createPromoter,
	createUser,
	uniqueEmail,
} from '../support/factories';
import {
	expectedSignature,
	settle,
	startWebhookReceiver,
	WebhookReceiver,
} from '../support/webhook-helpers';
import {
	Circle,
	Link,
	Member,
	Program,
	Promoter,
	PromoterMember,
	PromoterWebhook,
} from '../../src/entities';
import { memberRoleEnum, statusEnum, userRoleEnum } from '../../src/enums';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Promoter webhooks: a promoter's own subscriptions under
 * /programs/:program_id/promoters/:promoter_id/webhooks, managed by its
 * members, and delivery of that promoter's events to them.
 */
describe('promoter webhooks (e2e)', () => {
	let app: INestApplication<App>;
	let dataSource: DataSource;

	beforeAll(async () => {
		app = await createTestApp({ http: true });
		dataSource = app.get(DataSource);
	});

	afterAll(async () => {
		await app?.close();
	});

	const webhooksUrl = (program: Program, promoter: Promoter) =>
		`/api/programs/${program.programId}/promoters/${promoter.promoterId}/webhooks`;

	const body = (overrides: Record<string, unknown> = {}) => ({
		url: 'https://promoter.example.com/hook',
		secret: 'promoter-secret-123',
		events: ['signup.created'],
		...overrides,
	});

	/** Adds `member` to `promoter` with `role`. */
	const joinPromoter = (
		member: Member,
		promoter: Promoter,
		role: memberRoleEnum,
	) =>
		dataSource.getRepository(PromoterMember).save({
			promoterId: promoter.promoterId,
			memberId: member.memberId,
			role,
			status: statusEnum.ACTIVE,
		});

	/**
	 * CRUD by promoter members, validation, the per-promoter event rule, member
	 * roles and isolation between promoters.
	 */
	describe('management', () => {
		useIsolatedTransaction(() => dataSource);

		let program: Program;
		let circle: Circle;
		let promoter: Promoter;
		let member: Member;

		beforeEach(async () => {
			({ program, defaultCircle: circle } =
				await createProgram(dataSource));
			({ promoter, member } = await createPromoter(
				dataSource,
				program,
				circle,
			));
		});

		const url = () => webhooksUrl(program, promoter);

		const create = async (overrides: Record<string, unknown> = {}) => {
			const response = await request(app.getHttpServer())
				.post(url())
				.set(...asMember(app, member))
				.send(body(overrides))
				.expect(201);
			return response.body.data;
		};

		it('lets the promoter admin create a webhook', async () => {
			const response = await request(app.getHttpServer())
				.post(url())
				.set(...asMember(app, member))
				.send(
					body({ events: ['signup.created', 'commission.created'] }),
				)
				.expect(201);

			expect(response.body.data).toMatchObject({
				webhook_id: expect.stringMatching(UUID),
				program_id: program.programId,
				promoter_id: promoter.promoterId,
				url: 'https://promoter.example.com/hook',
				events: ['signup.created', 'commission.created'],
			});

			const stored = await dataSource
				.getRepository(PromoterWebhook)
				.findOneByOrFail({ webhookId: response.body.data.webhook_id });
			expect(stored.programId).toBe(program.programId);
			expect(stored.promoterId).toBe(promoter.promoterId);
		});

		it('lists, reads, updates and deletes the webhook', async () => {
			const created = await create();
			const itemUrl = `${url()}/${created.webhook_id}`;

			const list = await request(app.getHttpServer())
				.get(url())
				.set(...asMember(app, member))
				.expect(200);
			expect(list.body.data).toMatchObject({
				count: 1,
				skip: 0,
				take: 10,
			});
			expect(list.body.data.items[0].webhook_id).toBe(created.webhook_id);

			const read = await request(app.getHttpServer())
				.get(itemUrl)
				.set(...asMember(app, member))
				.expect(200);
			expect(read.body.data).toMatchObject({
				webhook_id: created.webhook_id,
				promoter_id: promoter.promoterId,
			});

			await request(app.getHttpServer())
				.patch(itemUrl)
				.set(...asMember(app, member))
				.send({
					url: 'https://promoter.example.com/v2',
					events: ['purchase.created'],
				})
				.expect(200);
			const updated = await dataSource
				.getRepository(PromoterWebhook)
				.findOneByOrFail({ webhookId: created.webhook_id });
			expect(updated.url).toBe('https://promoter.example.com/v2');
			expect(updated.events).toEqual(['purchase.created']);

			await request(app.getHttpServer())
				.delete(itemUrl)
				.set(...asMember(app, member))
				.expect(200);
			expect(
				await dataSource
					.getRepository(PromoterWebhook)
					.existsBy({ webhookId: created.webhook_id }),
			).toBe(false);
		});

		it.each([
			['url is missing', { url: undefined }],
			['secret is empty', { secret: '' }],
			['events is empty', { events: [] }],
			['events is not an array', { events: 'signup.created' }],
			[
				'an undeclared property is sent',
				{ promoter_id: '00000000-0000-0000-0000-000000000000' },
			],
		])('400s creating when %s', async (_case, overrides) => {
			await request(app.getHttpServer())
				.post(url())
				.set(...asMember(app, member))
				.send(body(overrides))
				.expect(400);
		});

		it.each([
			['nothing is sent', {}],
			['events is empty', { events: [] }],
		])('400s updating when %s', async (_case, update) => {
			const created = await create();

			await request(app.getHttpServer())
				.patch(`${url()}/${created.webhook_id}`)
				.set(...asMember(app, member))
				.send(update)
				.expect(400);
		});

		it('400s for an unknown webhook id', async () => {
			const unknown = `${url()}/00000000-0000-0000-0000-000000000000`;

			await request(app.getHttpServer())
				.get(unknown)
				.set(...asMember(app, member))
				.expect(400);
			await request(app.getHttpServer())
				.patch(unknown)
				.set(...asMember(app, member))
				.send({ url: 'https://x.example.com' })
				.expect(400);
			await request(app.getHttpServer())
				.delete(unknown)
				.set(...asMember(app, member))
				.expect(400);
		});

		it("rejects events already assigned to another of the promoter's webhooks", async () => {
			await create({ events: ['signup.created'] });
			const second = await create({ events: ['purchase.created'] });

			const conflict = await request(app.getHttpServer())
				.post(url())
				.set(...asMember(app, member))
				.send(body({ events: ['signup.created'] }))
				.expect(400);
			expect(conflict.body.message).toBe(
				'Events signup.created are already assigned to another webhook for this promoter.',
			);

			await request(app.getHttpServer())
				.patch(`${url()}/${second.webhook_id}`)
				.set(...asMember(app, member))
				.send({ events: ['purchase.created', 'signup.created'] })
				.expect(400);
		});

		it('scopes the event rule to the promoter, and apart from program webhooks', async () => {
			const { promoter: other, member: otherMember } =
				await createPromoter(dataSource, program, circle);
			const admin = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				admin,
				program,
				userRoleEnum.ADMIN,
			);

			await create({ events: ['signup.created'] });
			await request(app.getHttpServer())
				.post(webhooksUrl(program, other))
				.set(...asMember(app, otherMember))
				.send(body({ events: ['signup.created'] }))
				.expect(201);
			await request(app.getHttpServer())
				.post(`/api/programs/${program.programId}/webhooks`)
				.set(...asUser(app, admin))
				.send(body({ events: ['signup.created'] }))
				.expect(201);
		});

		it('lets a promoter editor manage webhooks', async () => {
			const editor = await createMember(dataSource, program);
			await joinPromoter(editor, promoter, memberRoleEnum.EDITOR);

			const created = await request(app.getHttpServer())
				.post(url())
				.set(...asMember(app, editor))
				.send(body())
				.expect(201);
			await request(app.getHttpServer())
				.delete(`${url()}/${created.body.data.webhook_id}`)
				.set(...asMember(app, editor))
				.expect(200);
		});

		it('lets a promoter viewer read but not change webhooks', async () => {
			const created = await create();
			const viewer = await createMember(dataSource, program);
			await joinPromoter(viewer, promoter, memberRoleEnum.VIEWER);
			const itemUrl = `${url()}/${created.webhook_id}`;

			await request(app.getHttpServer())
				.get(url())
				.set(...asMember(app, viewer))
				.expect(200);
			await request(app.getHttpServer())
				.get(itemUrl)
				.set(...asMember(app, viewer))
				.expect(200);
			await request(app.getHttpServer())
				.post(url())
				.set(...asMember(app, viewer))
				.send(body({ events: ['purchase.created'] }))
				.expect(403);
			await request(app.getHttpServer())
				.patch(itemUrl)
				.set(...asMember(app, viewer))
				.send({ url: 'https://evil.example.com' })
				.expect(403);
			await request(app.getHttpServer())
				.delete(itemUrl)
				.set(...asMember(app, viewer))
				.expect(403);
		});

		it("lets the promoter's API key manage its webhooks", async () => {
			const credentials = await createApiKeyCredentials(
				dataSource,
				program.programId,
				promoter.promoterId,
			);

			const created = await request(app.getHttpServer())
				.post(url())
				.set(apiKeyHeaders(credentials))
				.send(body())
				.expect(201);
			await request(app.getHttpServer())
				.get(url())
				.set(apiKeyHeaders(credentials))
				.expect(200);
			await request(app.getHttpServer())
				.delete(`${url()}/${created.body.data.webhook_id}`)
				.set(apiKeyHeaders(credentials))
				.expect(200);
		});

		it('keeps program users and program API keys out', async () => {
			const created = await create();
			const admin = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				admin,
				program,
				userRoleEnum.ADMIN,
			);
			const programKey = await createApiKeyCredentials(
				dataSource,
				program.programId,
			);

			await request(app.getHttpServer())
				.get(url())
				.set(...asUser(app, admin))
				.expect(403);
			await request(app.getHttpServer())
				.delete(`${url()}/${created.webhook_id}`)
				.set(...asUser(app, admin))
				.expect(403);
			await request(app.getHttpServer())
				.get(url())
				.set(apiKeyHeaders(programKey))
				.expect(403);
		});

		/**
		 * One promoter's webhooks are invisible to every other promoter, by
		 * route and by id.
		 */
		describe('isolation between promoters', () => {
			let other: Promoter;
			let otherMember: Member;
			let foreign: any;

			beforeEach(async () => {
				({ promoter: other, member: otherMember } =
					await createPromoter(dataSource, program, circle));
				foreign = await create();
			});

			it("forbids another promoter's member from its routes", async () => {
				await request(app.getHttpServer())
					.get(url())
					.set(...asMember(app, otherMember))
					.expect(403);
				await request(app.getHttpServer())
					.get(`${url()}/${foreign.webhook_id}`)
					.set(...asMember(app, otherMember))
					.expect(403);
				await request(app.getHttpServer())
					.post(url())
					.set(...asMember(app, otherMember))
					.send(body({ events: ['purchase.created'] }))
					.expect(403);
				await request(app.getHttpServer())
					.patch(`${url()}/${foreign.webhook_id}`)
					.set(...asMember(app, otherMember))
					.send({ url: 'https://evil.example.com' })
					.expect(403);
				await request(app.getHttpServer())
					.delete(`${url()}/${foreign.webhook_id}`)
					.set(...asMember(app, otherMember))
					.expect(403);
			});

			it("does not resolve the webhook through another promoter's route", async () => {
				const itemUrl = `${webhooksUrl(program, other)}/${foreign.webhook_id}`;

				await request(app.getHttpServer())
					.get(itemUrl)
					.set(...asMember(app, otherMember))
					.expect(400);
				await request(app.getHttpServer())
					.patch(itemUrl)
					.set(...asMember(app, otherMember))
					.send({ url: 'https://evil.example.com' })
					.expect(400);
				await request(app.getHttpServer())
					.delete(itemUrl)
					.set(...asMember(app, otherMember))
					.expect(400);

				const list = await request(app.getHttpServer())
					.get(webhooksUrl(program, other))
					.set(...asMember(app, otherMember))
					.expect(200);
				expect(list.body.data.items).toEqual([]);

				const stored = await dataSource
					.getRepository(PromoterWebhook)
					.findOneByOrFail({ webhookId: foreign.webhook_id });
				expect(stored.url).toBe(foreign.url);
			});

			it("forbids another promoter's API key", async () => {
				const otherKey = await createApiKeyCredentials(
					dataSource,
					program.programId,
					other.promoterId,
				);

				await request(app.getHttpServer())
					.get(url())
					.set(apiKeyHeaders(otherKey))
					.expect(403);
				await request(app.getHttpServer())
					.delete(`${url()}/${foreign.webhook_id}`)
					.set(apiKeyHeaders(otherKey))
					.expect(403);
			});
		});
	});

	/**
	 * Delivery of a promoter's events to its own webhooks through BullMQ.
	 * Committed data (truncateAll) for the same reason as the program-webhook
	 * delivery tests: the handlers run after the response.
	 */
	describe('delivery', () => {
		let receiver: WebhookReceiver;
		let program: Program;
		let promoter: Promoter;
		let member: Member;
		let otherPromoter: Promoter;
		let otherMember: Member;
		let link: Link;
		let apiKey: ApiKeyCredentials;

		beforeAll(async () => {
			receiver = await startWebhookReceiver();
		});

		afterAll(async () => {
			await receiver?.close();
			await truncateAll(dataSource);
		});

		beforeEach(async () => {
			await settle(250);
			receiver.reset();
			await truncateAll(dataSource);

			const fixture = await createProgram(dataSource);
			program = fixture.program;
			({ promoter, member } = await createPromoter(
				dataSource,
				program,
				fixture.defaultCircle,
			));
			({ promoter: otherPromoter, member: otherMember } =
				await createPromoter(
					dataSource,
					program,
					fixture.defaultCircle,
				));
			link = await createLink(dataSource, program, promoter);
			apiKey = await createApiKeyCredentials(
				dataSource,
				program.programId,
			);
		});

		const register = async (
			owner: Promoter,
			as: Member,
			path: string,
			events: string[],
			secret: string,
		) => {
			await request(app.getHttpServer())
				.post(webhooksUrl(program, owner))
				.set(...asMember(app, as))
				.send({ url: receiver.url(path), secret, events })
				.expect(201);
		};

		const waitForDeliveries = (path: string, count: number) =>
			vi.waitFor(
				() => {
					expect(receiver.on(path)).toHaveLength(count);
				},
				{ timeout: 20000, interval: 100 },
			);

		it("delivers the promoter's signup to its webhook, signed, and to no other promoter", async () => {
			await register(
				promoter,
				member,
				'/mine',
				['signup.created'],
				'mine-secret',
			);
			await register(
				otherPromoter,
				otherMember,
				'/theirs',
				['signup.created'],
				'their-secret',
			);

			await request(app.getHttpServer())
				.post('/api/signups')
				.set(apiKeyHeaders(apiKey))
				.send({ ref_val: link.refVal, email: uniqueEmail('signup') })
				.expect(201);

			await waitForDeliveries('/mine', 1);
			await settle();

			const [delivery] = receiver.on('/mine');
			expect(delivery.body).toMatchObject({
				id: expect.stringMatching(UUID),
				specversion: '1.0',
				type: 'in.org.quicko.cliq.signup.created',
				source: 'urn:POST:/signups',
				program_id: program.programId,
				promoter_id: promoter.promoterId,
				data: {
					promoter_id: promoter.promoterId,
					link_id: link.linkId,
				},
			});
			expect(delivery.headers['x-webhook-signature']).toBe(
				expectedSignature(delivery.body.data, 'mine-secret'),
			);
			expect(receiver.on('/theirs')).toHaveLength(0);
		});

		it('delivers to both the program webhook and the promoter webhook', async () => {
			const admin = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				admin,
				program,
				userRoleEnum.ADMIN,
			);
			await request(app.getHttpServer())
				.post(`/api/programs/${program.programId}/webhooks`)
				.set(...asUser(app, admin))
				.send({
					url: receiver.url('/program'),
					secret: 'program-secret',
					events: ['signup.created'],
				})
				.expect(201);
			await register(
				promoter,
				member,
				'/promoter',
				['signup.created'],
				'promoter-secret',
			);

			await request(app.getHttpServer())
				.post('/api/signups')
				.set(apiKeyHeaders(apiKey))
				.send({ ref_val: link.refVal, email: uniqueEmail('signup') })
				.expect(201);

			await waitForDeliveries('/program', 1);
			await waitForDeliveries('/promoter', 1);

			const [toProgram] = receiver.on('/program');
			const [toPromoter] = receiver.on('/promoter');
			// The same event, signed separately with each webhook's secret.
			expect(toPromoter.body).toEqual(toProgram.body);
			expect(toProgram.headers['x-webhook-signature']).toBe(
				expectedSignature(toProgram.body.data, 'program-secret'),
			);
			expect(toPromoter.headers['x-webhook-signature']).toBe(
				expectedSignature(toPromoter.body.data, 'promoter-secret'),
			);
		});
	});
});
