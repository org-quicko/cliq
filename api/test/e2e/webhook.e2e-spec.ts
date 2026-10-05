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
import { Link, Program, Promoter, User, Webhook } from '../../src/entities';
import { userRoleEnum } from '../../src/enums';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Program webhooks: CRUD under /programs/:program_id/webhooks, and delivery
 * of domain events to them through the BullMQ queue.
 */
describe('program webhooks (e2e)', () => {
	let app: INestApplication<App>;
	let dataSource: DataSource;

	beforeAll(async () => {
		app = await createTestApp({ http: true });
		dataSource = app.get(DataSource);
	});

	afterAll(async () => {
		await app?.close();
	});

	const webhooksUrl = (p: Program) => `/api/programs/${p.programId}/webhooks`;

	const body = (overrides: Record<string, unknown> = {}) => ({
		url: 'https://hooks.example.com/cliq',
		secret: 'whsec-0123456789',
		events: ['signup.created'],
		...overrides,
	});

	/**
	 * Create / read / update / delete, validation, the one-webhook-per-event
	 * rule, roles and cross-program isolation.
	 */
	describe('management', () => {
		useIsolatedTransaction(() => dataSource);

		let program: Program;
		let admin: User;

		beforeEach(async () => {
			({ program } = await createProgram(dataSource));
			admin = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				admin,
				program,
				userRoleEnum.ADMIN,
			);
		});

		const create = async (
			overrides: Record<string, unknown> = {},
			p: Program = program,
		) => {
			const response = await request(app.getHttpServer())
				.post(webhooksUrl(p))
				.set(...asUser(app, admin))
				.send(body(overrides))
				.expect(201);
			return response.body.data;
		};

		describe('POST /webhooks', () => {
			it('creates a webhook for the program', async () => {
				const response = await request(app.getHttpServer())
					.post(webhooksUrl(program))
					.set(...asUser(app, admin))
					.send(
						body({
							events: ['signup.created', 'purchase.created'],
						}),
					)
					.expect(201);

				expect(response.body.data).toMatchObject({
					webhook_id: expect.stringMatching(UUID),
					program_id: program.programId,
					url: 'https://hooks.example.com/cliq',
					events: ['signup.created', 'purchase.created'],
					created_at: expect.any(String),
					updated_at: expect.any(String),
				});

				const stored = await dataSource
					.getRepository(Webhook)
					.findOneByOrFail({
						webhookId: response.body.data.webhook_id,
					});
				expect(stored.programId).toBe(program.programId);
				expect(stored.events).toEqual([
					'signup.created',
					'purchase.created',
				]);
			});

			it.each([
				['url is missing', { url: undefined }],
				['url is empty', { url: '' }],
				['secret is missing', { secret: undefined }],
				['secret is empty', { secret: '' }],
				['events is missing', { events: undefined }],
				['events is empty', { events: [] }],
				['events is not an array', { events: 'signup.created' }],
				[
					'an undeclared property is sent',
					{ program_id: '00000000-0000-0000-0000-000000000000' },
				],
			])('400s when %s', async (_case, overrides) => {
				await request(app.getHttpServer())
					.post(webhooksUrl(program))
					.set(...asUser(app, admin))
					.send(body(overrides))
					.expect(400);

				expect(
					await dataSource
						.getRepository(Webhook)
						.countBy({ programId: program.programId }),
				).toBe(0);
			});

			it('rejects events already assigned to another webhook in the program', async () => {
				await create({
					events: ['signup.created', 'purchase.created'],
				});

				const response = await request(app.getHttpServer())
					.post(webhooksUrl(program))
					.set(...asUser(app, admin))
					.send(
						body({
							url: 'https://other.example.com',
							events: ['commission.created', 'purchase.created'],
						}),
					)
					.expect(400);

				expect(response.body.message).toBe(
					'Events purchase.created are already assigned to another webhook in this program.',
				);
				expect(
					await dataSource
						.getRepository(Webhook)
						.countBy({ programId: program.programId }),
				).toBe(1);
			});

			it('allows separate webhooks for disjoint events', async () => {
				await create({ events: ['signup.created'] });
				await create({ events: ['purchase.created'] });

				expect(
					await dataSource
						.getRepository(Webhook)
						.countBy({ programId: program.programId }),
				).toBe(2);
			});

			it('scopes the event rule to the program', async () => {
				const { program: other } = await createProgram(dataSource);
				await addUserToProgram(
					dataSource,
					admin,
					other,
					userRoleEnum.ADMIN,
				);

				const mine = await create({ events: ['signup.created'] });
				const theirs = await create(
					{ events: ['signup.created'] },
					other,
				);

				expect(mine.program_id).toBe(program.programId);
				expect(theirs.program_id).toBe(other.programId);
			});
		});

		describe('GET /webhooks', () => {
			it("lists only the program's webhooks, paginated", async () => {
				const { program: other } = await createProgram(dataSource);
				await addUserToProgram(
					dataSource,
					admin,
					other,
					userRoleEnum.ADMIN,
				);
				await create({ events: ['signup.created'] });
				await create({ events: ['purchase.created'] });
				await create({ events: ['commission.created'] });
				const foreign = await create(
					{ events: ['signup.created'] },
					other,
				);

				const all = await request(app.getHttpServer())
					.get(webhooksUrl(program))
					.set(...asUser(app, admin))
					.expect(200);
				expect(all.body.data).toMatchObject({
					count: 3,
					skip: 0,
					take: 10,
				});
				expect(all.body.data.items).toHaveLength(3);
				expect(
					all.body.data.items.every(
						(w: any) => w.program_id === program.programId,
					),
				).toBe(true);
				expect(JSON.stringify(all.body.data)).not.toContain(
					foreign.webhook_id,
				);

				const page = await request(app.getHttpServer())
					.get(webhooksUrl(program))
					.query({ skip: 1, take: 1 })
					.set(...asUser(app, admin))
					.expect(200);
				expect(page.body.data).toMatchObject({
					count: 3,
					skip: 1,
					take: 1,
				});
				expect(page.body.data.items).toHaveLength(1);
			});

			it('returns an empty list when there are none', async () => {
				const response = await request(app.getHttpServer())
					.get(webhooksUrl(program))
					.set(...asUser(app, admin))
					.expect(200);

				expect(response.body.data.items).toEqual([]);
			});
		});

		describe('GET /webhooks/:webhook_id', () => {
			it('returns the webhook', async () => {
				const created = await create();

				const response = await request(app.getHttpServer())
					.get(`${webhooksUrl(program)}/${created.webhook_id}`)
					.set(...asUser(app, admin))
					.expect(200);

				expect(response.body.data).toMatchObject({
					webhook_id: created.webhook_id,
					program_id: program.programId,
					url: created.url,
					events: created.events,
				});
			});

			it('400s for an unknown webhook id', async () => {
				await request(app.getHttpServer())
					.get(
						`${webhooksUrl(program)}/00000000-0000-0000-0000-000000000000`,
					)
					.set(...asUser(app, admin))
					.expect(400);
			});
		});

		describe('PATCH /webhooks/:webhook_id', () => {
			it('updates the url, secret and events', async () => {
				const created = await create();

				await request(app.getHttpServer())
					.patch(`${webhooksUrl(program)}/${created.webhook_id}`)
					.set(...asUser(app, admin))
					.send({
						url: 'https://new.example.com/hook',
						secret: 'rotated-secret',
						events: ['purchase.created'],
					})
					.expect(200);

				const stored = await dataSource
					.getRepository(Webhook)
					.findOneByOrFail({ webhookId: created.webhook_id });
				expect(stored.url).toBe('https://new.example.com/hook');
				expect(stored.secret).toBe('rotated-secret');
				expect(stored.events).toEqual(['purchase.created']);
			});

			it('keeps fields that are not sent', async () => {
				const created = await create({ events: ['signup.created'] });

				await request(app.getHttpServer())
					.patch(`${webhooksUrl(program)}/${created.webhook_id}`)
					.set(...asUser(app, admin))
					.send({ url: 'https://new.example.com/hook' })
					.expect(200);

				const stored = await dataSource
					.getRepository(Webhook)
					.findOneByOrFail({ webhookId: created.webhook_id });
				expect(stored.url).toBe('https://new.example.com/hook');
				expect(stored.events).toEqual(['signup.created']);
			});

			it('lets a webhook keep its own events', async () => {
				const created = await create({ events: ['signup.created'] });

				await request(app.getHttpServer())
					.patch(`${webhooksUrl(program)}/${created.webhook_id}`)
					.set(...asUser(app, admin))
					.send({ events: ['signup.created', 'purchase.created'] })
					.expect(200);
			});

			it("rejects taking another webhook's events", async () => {
				await create({ events: ['signup.created'] });
				const second = await create({ events: ['purchase.created'] });

				await request(app.getHttpServer())
					.patch(`${webhooksUrl(program)}/${second.webhook_id}`)
					.set(...asUser(app, admin))
					.send({ events: ['purchase.created', 'signup.created'] })
					.expect(400);

				const stored = await dataSource
					.getRepository(Webhook)
					.findOneByOrFail({ webhookId: second.webhook_id });
				expect(stored.events).toEqual(['purchase.created']);
			});

			it.each([
				['nothing is sent', {}],
				['events is empty', { events: [] }],
				['url is empty', { url: '' }],
				['secret is empty', { secret: '' }],
				[
					'an undeclared property is sent',
					{ program_id: '00000000-0000-0000-0000-000000000000' },
				],
			])('400s when %s', async (_case, update) => {
				const created = await create();

				await request(app.getHttpServer())
					.patch(`${webhooksUrl(program)}/${created.webhook_id}`)
					.set(...asUser(app, admin))
					.send(update)
					.expect(400);
			});

			it('400s for an unknown webhook id', async () => {
				await request(app.getHttpServer())
					.patch(
						`${webhooksUrl(program)}/00000000-0000-0000-0000-000000000000`,
					)
					.set(...asUser(app, admin))
					.send({ url: 'https://new.example.com' })
					.expect(400);
			});
		});

		describe('DELETE /webhooks/:webhook_id', () => {
			it('deletes the webhook and frees its events', async () => {
				const created = await create({ events: ['signup.created'] });

				await request(app.getHttpServer())
					.delete(`${webhooksUrl(program)}/${created.webhook_id}`)
					.set(...asUser(app, admin))
					.expect(200);

				expect(
					await dataSource
						.getRepository(Webhook)
						.existsBy({ webhookId: created.webhook_id }),
				).toBe(false);
				await create({ events: ['signup.created'] });
			});

			it('400s for an unknown webhook id', async () => {
				await request(app.getHttpServer())
					.delete(
						`${webhooksUrl(program)}/00000000-0000-0000-0000-000000000000`,
					)
					.set(...asUser(app, admin))
					.expect(400);
			});
		});

		describe('roles', () => {
			it('lets a program editor manage webhooks', async () => {
				const editor = await createUser(dataSource);
				await addUserToProgram(
					dataSource,
					editor,
					program,
					userRoleEnum.EDITOR,
				);

				const created = await request(app.getHttpServer())
					.post(webhooksUrl(program))
					.set(...asUser(app, editor))
					.send(body())
					.expect(201);
				const url = `${webhooksUrl(program)}/${created.body.data.webhook_id}`;

				await request(app.getHttpServer())
					.patch(url)
					.set(...asUser(app, editor))
					.send({ url: 'https://new.example.com' })
					.expect(200);
				await request(app.getHttpServer())
					.delete(url)
					.set(...asUser(app, editor))
					.expect(200);
			});

			it('lets a program viewer read but not change webhooks', async () => {
				const created = await create();
				const viewer = await createUser(dataSource);
				await addUserToProgram(
					dataSource,
					viewer,
					program,
					userRoleEnum.VIEWER,
				);
				const url = `${webhooksUrl(program)}/${created.webhook_id}`;

				await request(app.getHttpServer())
					.get(webhooksUrl(program))
					.set(...asUser(app, viewer))
					.expect(200);
				await request(app.getHttpServer())
					.get(url)
					.set(...asUser(app, viewer))
					.expect(200);

				await request(app.getHttpServer())
					.post(webhooksUrl(program))
					.set(...asUser(app, viewer))
					.send(body({ events: ['purchase.created'] }))
					.expect(403);
				await request(app.getHttpServer())
					.patch(url)
					.set(...asUser(app, viewer))
					.send({ url: 'https://evil.example.com' })
					.expect(403);
				await request(app.getHttpServer())
					.delete(url)
					.set(...asUser(app, viewer))
					.expect(403);

				const stored = await dataSource
					.getRepository(Webhook)
					.findOneByOrFail({ webhookId: created.webhook_id });
				expect(stored.url).toBe(created.url);
			});

			it('lets a program API key manage webhooks', async () => {
				const credentials = await createApiKeyCredentials(
					dataSource,
					program.programId,
				);

				const created = await request(app.getHttpServer())
					.post(webhooksUrl(program))
					.set(apiKeyHeaders(credentials))
					.send(body())
					.expect(201);

				await request(app.getHttpServer())
					.get(
						`${webhooksUrl(program)}/${created.body.data.webhook_id}`,
					)
					.set(apiKeyHeaders(credentials))
					.expect(200);
			});

			it('keeps promoter members and promoter API keys out', async () => {
				const { program: fixture, defaultCircle } =
					await createProgram(dataSource);
				await addUserToProgram(
					dataSource,
					admin,
					fixture,
					userRoleEnum.ADMIN,
				);
				const { promoter, member } = await createPromoter(
					dataSource,
					fixture,
					defaultCircle,
				);
				const promoterKey = await createApiKeyCredentials(
					dataSource,
					fixture.programId,
					promoter.promoterId,
				);
				const created = await create({}, fixture);

				// A member is turned away before any ability check: the route
				// resolves its subject from the program-user context, which a
				// member token never carries, so it answers 400 (as in
				// auth.e2e-spec.ts) rather than 403.
				await request(app.getHttpServer())
					.get(webhooksUrl(fixture))
					.set(...asMember(app, member))
					.expect(400);
				await request(app.getHttpServer())
					.post(webhooksUrl(fixture))
					.set(...asMember(app, member))
					.send(body({ events: ['purchase.created'] }))
					.expect(400);
				await request(app.getHttpServer())
					.get(`${webhooksUrl(fixture)}/${created.webhook_id}`)
					.set(apiKeyHeaders(promoterKey))
					.expect(403);
				await request(app.getHttpServer())
					.post(webhooksUrl(fixture))
					.set(apiKeyHeaders(promoterKey))
					.send(body({ events: ['purchase.created'] }))
					.expect(403);
			});
		});

		/**
		 * A webhook is only visible through its own program, whatever the
		 * caller's rights elsewhere.
		 */
		describe('cross-program isolation', () => {
			let other: Program;
			let foreign: any;

			beforeEach(async () => {
				({ program: other } = await createProgram(dataSource));
				const otherAdmin = await createUser(dataSource);
				await addUserToProgram(
					dataSource,
					otherAdmin,
					other,
					userRoleEnum.ADMIN,
				);
				const response = await request(app.getHttpServer())
					.post(webhooksUrl(other))
					.set(...asUser(app, otherAdmin))
					.send(body())
					.expect(201);
				foreign = response.body.data;
			});

			it('forbids a user outside the program from reaching its webhooks', async () => {
				await request(app.getHttpServer())
					.get(webhooksUrl(other))
					.set(...asUser(app, admin))
					.expect(403);
				await request(app.getHttpServer())
					.get(`${webhooksUrl(other)}/${foreign.webhook_id}`)
					.set(...asUser(app, admin))
					.expect(403);
				await request(app.getHttpServer())
					.post(webhooksUrl(other))
					.set(...asUser(app, admin))
					.send(body({ events: ['purchase.created'] }))
					.expect(403);
				await request(app.getHttpServer())
					.patch(`${webhooksUrl(other)}/${foreign.webhook_id}`)
					.set(...asUser(app, admin))
					.send({ url: 'https://evil.example.com' })
					.expect(403);
				await request(app.getHttpServer())
					.delete(`${webhooksUrl(other)}/${foreign.webhook_id}`)
					.set(...asUser(app, admin))
					.expect(403);
			});

			it("does not resolve another program's webhook through the caller's own program", async () => {
				const url = `${webhooksUrl(program)}/${foreign.webhook_id}`;

				await request(app.getHttpServer())
					.get(url)
					.set(...asUser(app, admin))
					.expect(400);
				await request(app.getHttpServer())
					.patch(url)
					.set(...asUser(app, admin))
					.send({ url: 'https://evil.example.com' })
					.expect(400);
				await request(app.getHttpServer())
					.delete(url)
					.set(...asUser(app, admin))
					.expect(400);

				const stored = await dataSource
					.getRepository(Webhook)
					.findOneByOrFail({ webhookId: foreign.webhook_id });
				expect(stored.url).toBe(foreign.url);
				expect(stored.programId).toBe(other.programId);
			});

			it("forbids a program API key from reaching another program's webhooks", async () => {
				const credentials = await createApiKeyCredentials(
					dataSource,
					program.programId,
				);

				await request(app.getHttpServer())
					.get(webhooksUrl(other))
					.set(apiKeyHeaders(credentials))
					.expect(403);
				await request(app.getHttpServer())
					.delete(`${webhooksUrl(other)}/${foreign.webhook_id}`)
					.set(apiKeyHeaders(credentials))
					.expect(403);
			});
		});
	});

	/**
	 * End-to-end delivery: an event raised by an API call is matched to the
	 * program's subscribed webhooks, queued in BullMQ (real Redis), and POSTed
	 * by the in-process consumer to a local receiver with an HMAC signature.
	 *
	 * Runs on committed data (truncateAll) rather than an isolated
	 * transaction: the event handlers run after the request returns, and
	 * would otherwise race the rollback.
	 */
	describe('delivery', () => {
		let receiver: WebhookReceiver;
		let program: Program;
		let promoter: Promoter;
		let link: Link;
		let apiKey: ApiKeyCredentials;
		let admin: User;

		beforeAll(async () => {
			receiver = await startWebhookReceiver();
		});

		afterAll(async () => {
			await receiver?.close();
			await truncateAll(dataSource);
		});

		beforeEach(async () => {
			// Let deliveries from the previous test drain before resetting.
			await settle(250);
			receiver.reset();
			await truncateAll(dataSource);

			const fixture = await createProgram(dataSource);
			program = fixture.program;
			({ promoter } = await createPromoter(
				dataSource,
				program,
				fixture.defaultCircle,
			));
			link = await createLink(dataSource, program, promoter);
			apiKey = await createApiKeyCredentials(
				dataSource,
				program.programId,
			);
			admin = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				admin,
				program,
				userRoleEnum.ADMIN,
			);
		});

		const register = async (
			path: string,
			events: string[],
			secret = 'delivery-secret-123',
			p: Program = program,
		) => {
			const response = await request(app.getHttpServer())
				.post(webhooksUrl(p))
				.set(...asUser(app, admin))
				.send({ url: receiver.url(path), secret, events })
				.expect(201);
			return response.body.data;
		};

		const signUp = async (email = uniqueEmail('signup')) => {
			const response = await request(app.getHttpServer())
				.post('/api/signups')
				.set(apiKeyHeaders(apiKey))
				.send({
					ref_val: link.refVal,
					email,
					first_name: 'Ref',
					last_name: 'Erred',
				})
				.expect(201);
			return response.body.data;
		};

		const waitForDeliveries = (path: string, count: number) =>
			vi.waitFor(
				() => {
					expect(receiver.on(path)).toHaveLength(count);
				},
				{ timeout: 20000, interval: 100 },
			);

		it('delivers a signed CloudEvents payload for a subscribed event', async () => {
			const secret = 'delivery-secret-123';
			await register('/signups', ['signup.created'], secret);
			const email = uniqueEmail('signup');

			const before = Date.now();
			await signUp(email);
			await waitForDeliveries('/signups', 1);

			const [delivery] = receiver.on('/signups');
			expect(delivery.headers['content-type']).toContain(
				'application/json',
			);
			expect(delivery.body).toMatchObject({
				id: expect.stringMatching(UUID),
				specversion: '1.0',
				datacontenttype: 'application/json',
				type: 'in.org.quicko.cliq.signup.created',
				source: 'urn:POST:/signups',
				program_id: program.programId,
				promoter_id: promoter.promoterId,
				data: {
					contact_id: expect.stringMatching(UUID),
					promoter_id: promoter.promoterId,
					link_id: link.linkId,
				},
			});
			const time = Date.parse(delivery.body.time as string);
			expect(time).toBeGreaterThanOrEqual(before - 1000);
			expect(time).toBeLessThanOrEqual(Date.now());
			expect(delivery.body.subject).toBe(delivery.body.data.signup_id);

			const signature = delivery.headers['x-webhook-signature'];
			expect(signature).toMatch(/^[0-9a-f]{64}$/);
			expect(signature).toBe(
				expectedSignature(delivery.body.data, secret),
			);
			expect(signature).not.toBe(
				expectedSignature(delivery.body.data, 'wrong-secret'),
			);
		});

		it('routes each event only to the webhook subscribed to it', async () => {
			await register('/signups', ['signup.created'], 'signup-secret');
			await register('/contacts', ['contact.created'], 'contact-secret');
			await register(
				'/purchases',
				['purchase.created'],
				'purchase-secret',
			);
			const email = uniqueEmail('signup');

			await signUp(email);
			await waitForDeliveries('/signups', 1);
			await waitForDeliveries('/contacts', 1);
			await settle();

			const [signup] = receiver.on('/signups');
			const [contact] = receiver.on('/contacts');
			expect(signup.body.type).toBe('in.org.quicko.cliq.signup.created');
			expect(contact.body.type).toBe(
				'in.org.quicko.cliq.contact.created',
			);
			expect(contact.body.data).toMatchObject({
				email,
				first_name: 'Ref',
				last_name: 'Erred',
			});
			expect(contact.headers['x-webhook-signature']).toBe(
				expectedSignature(contact.body.data, 'contact-secret'),
			);
			expect(signup.body.id).not.toBe(contact.body.id);
			expect(receiver.on('/purchases')).toHaveLength(0);
			expect(receiver.received).toHaveLength(2);
		});

		it("does not deliver one program's events to another program's webhooks", async () => {
			const { program: other } = await createProgram(dataSource);
			await addUserToProgram(
				dataSource,
				admin,
				other,
				userRoleEnum.ADMIN,
			);
			await register('/mine', ['signup.created']);
			await register(
				'/theirs',
				['signup.created'],
				'their-secret',
				other,
			);

			await signUp();
			await waitForDeliveries('/mine', 1);
			await settle();

			expect(receiver.on('/theirs')).toHaveLength(0);
		});

		it('delivers to the updated url and signs with the rotated secret', async () => {
			const created = await register(
				'/old',
				['signup.created'],
				'old-secret',
			);
			await request(app.getHttpServer())
				.patch(`${webhooksUrl(program)}/${created.webhook_id}`)
				.set(...asUser(app, admin))
				.send({ url: receiver.url('/new'), secret: 'new-secret' })
				.expect(200);

			await signUp();
			await waitForDeliveries('/new', 1);
			await settle();

			const [delivery] = receiver.on('/new');
			expect(delivery.headers['x-webhook-signature']).toBe(
				expectedSignature(delivery.body.data, 'new-secret'),
			);
			expect(receiver.on('/old')).toHaveLength(0);
		});

		it('stops delivering once the webhook is deleted', async () => {
			const created = await register('/gone', ['signup.created']);
			await request(app.getHttpServer())
				.delete(`${webhooksUrl(program)}/${created.webhook_id}`)
				.set(...asUser(app, admin))
				.expect(200);

			await signUp();
			await settle(1500);

			expect(receiver.on('/gone')).toHaveLength(0);
		});

		it('retries a delivery the receiver rejected', async () => {
			const secret = 'retry-secret';
			await register('/flaky', ['signup.created'], secret);
			receiver.respondWith('/flaky', 500);

			await signUp();
			// First attempt fails; BullMQ retries after the 2s exponential backoff.
			await waitForDeliveries('/flaky', 2);

			const [first, retry] = receiver.on('/flaky');
			expect(retry.body).toEqual(first.body);
			expect(retry.headers['x-webhook-signature']).toBe(
				expectedSignature(retry.body.data, secret),
			);
		});
	});
});
