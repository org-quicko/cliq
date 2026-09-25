import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
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
	createLink,
	createMember,
	createProgram,
	createPromoter,
	createUser,
} from '../support/factories';
import {
	ApiKey,
	Circle,
	Member,
	Program,
	Promoter,
	PromoterMember,
	User,
} from '../../src/entities';
import { memberRoleEnum, statusEnum, userRoleEnum } from '../../src/enums';

/** The plaintext credentials an API-key response hands back. */
const credentialsFrom = (data: any): ApiKeyCredentials => ({
	apiKeyId: data.api_key_id,
	key: data.key,
	secret: data.secret,
});

/**
 * Program API keys (program admins, one per program) and promoter API keys
 * (promoter admins, one per promoter). The secret is handed back once at
 * creation and only a bcrypt hash is kept; a promoter key is confined to its
 * own promoter.
 */
describe('api keys (e2e)', () => {
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

	let program: Program;
	let defaultCircle: Circle;
	let admin: User;

	beforeEach(async () => {
		({ program, defaultCircle } = await createProgram(dataSource));
		admin = await createUser(dataSource);
		await addUserToProgram(dataSource, admin, program, userRoleEnum.ADMIN);
	});

	const programKeysUrl = (p: Program = program) =>
		`/api/programs/${p.programId}/api-keys`;

	const promoterKeysUrl = (promoter: Promoter, p: Program = program) =>
		`/api/programs/${p.programId}/promoters/${promoter.promoterId}/api-keys`;

	/**
	 * Program keys: created, read and deleted by program admins (and by a
	 * program key itself).
	 */
	describe('program keys', () => {
		it('returns the key and plaintext secret once, and stores only a hash', async () => {
			const response = await request(app.getHttpServer())
				.post(programKeysUrl())
				.set(...asUser(app, admin))
				.expect(201);

			const data = response.body.data;
			expect(data).toMatchObject({
				api_key_id: expect.any(String),
				key: expect.stringMatching(/^[0-9a-f]{32}$/),
				secret: expect.stringMatching(/^[0-9a-f]{64}$/),
				status: statusEnum.ACTIVE,
				promoter_id: null,
			});

			const stored = await dataSource
				.getRepository(ApiKey)
				.findOneByOrFail({ apiKeyId: data.api_key_id });
			expect(stored.programId).toBe(program.programId);
			expect(stored.key).toBe(data.key);
			expect(stored.secret).not.toBe(data.secret);
			expect(stored.secret.startsWith('$2')).toBe(true);
			expect(
				await bcrypt.compare(data.secret as string, stored.secret),
			).toBe(true);
		});

		it('issues credentials that authenticate against the program', async () => {
			const response = await request(app.getHttpServer())
				.post(programKeysUrl())
				.set(...asUser(app, admin))
				.expect(201);

			await request(app.getHttpServer())
				.get(`/api/programs/${program.programId}/circles`)
				.set(apiKeyHeaders(credentialsFrom(response.body.data)))
				.expect(200);
		});

		it('never returns the secret when the key is read back', async () => {
			const created = await request(app.getHttpServer())
				.post(programKeysUrl())
				.set(...asUser(app, admin))
				.expect(201);

			const response = await request(app.getHttpServer())
				.get(programKeysUrl())
				.set(...asUser(app, admin))
				.expect(200);

			expect(response.body.data).toMatchObject({
				api_key_id: created.body.data.api_key_id,
				key: created.body.data.key,
				status: statusEnum.ACTIVE,
			});
			expect(response.body.data).not.toHaveProperty('secret');
			expect(JSON.stringify(response.body)).not.toContain(
				created.body.data.secret,
			);
		});

		it('404s when the program has no key yet', async () => {
			await request(app.getHttpServer())
				.get(programKeysUrl())
				.set(...asUser(app, admin))
				.expect(404);
		});

		it('replaces the previous key, which stops authenticating', async () => {
			const first = await request(app.getHttpServer())
				.post(programKeysUrl())
				.set(...asUser(app, admin))
				.expect(201);
			const second = await request(app.getHttpServer())
				.post(programKeysUrl())
				.set(...asUser(app, admin))
				.expect(201);

			expect(second.body.data.key).not.toBe(first.body.data.key);
			expect(
				await dataSource
					.getRepository(ApiKey)
					.countBy({ programId: program.programId }),
			).toBe(1);

			await request(app.getHttpServer())
				.get(`/api/programs/${program.programId}/circles`)
				.set(apiKeyHeaders(credentialsFrom(first.body.data)))
				.expect(401);
			await request(app.getHttpServer())
				.get(`/api/programs/${program.programId}/circles`)
				.set(apiKeyHeaders(credentialsFrom(second.body.data)))
				.expect(200);
		});

		it('leaves promoter keys alone when regenerating the program key', async () => {
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const promoterKey = await createApiKeyCredentials(
				dataSource,
				program.programId,
				promoter.promoterId,
			);

			await request(app.getHttpServer())
				.post(programKeysUrl())
				.set(...asUser(app, admin))
				.expect(201);

			await request(app.getHttpServer())
				.get(
					`/api/programs/${program.programId}/promoters/${promoter.promoterId}`,
				)
				.set(apiKeyHeaders(promoterKey))
				.expect(200);
		});

		it('deletes the key, which then stops authenticating', async () => {
			const created = await request(app.getHttpServer())
				.post(programKeysUrl())
				.set(...asUser(app, admin))
				.expect(201);
			const credentials = credentialsFrom(created.body.data);

			await request(app.getHttpServer())
				.delete(`${programKeysUrl()}/${credentials.apiKeyId}`)
				.set(...asUser(app, admin))
				.expect(200);

			expect(
				await dataSource
					.getRepository(ApiKey)
					.existsBy({ apiKeyId: credentials.apiKeyId }),
			).toBe(false);
			await request(app.getHttpServer())
				.get(`/api/programs/${program.programId}/circles`)
				.set(apiKeyHeaders(credentials))
				.expect(401);
		});

		it('400s deleting a key id that is not in the program', async () => {
			await request(app.getHttpServer())
				.delete(
					`${programKeysUrl()}/00000000-0000-0000-0000-000000000000`,
				)
				.set(...asUser(app, admin))
				.expect(400);
		});

		it('will not delete a promoter key through the program route', async () => {
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const promoterKey = await createApiKeyCredentials(
				dataSource,
				program.programId,
				promoter.promoterId,
			);

			await request(app.getHttpServer())
				.delete(`${programKeysUrl()}/${promoterKey.apiKeyId}`)
				.set(...asUser(app, admin))
				.expect(400);

			expect(
				await dataSource
					.getRepository(ApiKey)
					.existsBy({ apiKeyId: promoterKey.apiKeyId }),
			).toBe(true);
		});

		it('rejects an inactive key', async () => {
			const credentials = await createApiKeyCredentials(
				dataSource,
				program.programId,
			);
			await dataSource
				.getRepository(ApiKey)
				.update(
					{ apiKeyId: credentials.apiKeyId },
					{ status: statusEnum.INACTIVE },
				);

			await request(app.getHttpServer())
				.get(`/api/programs/${program.programId}/circles`)
				.set(apiKeyHeaders(credentials))
				.expect(401);
		});

		it('401s on an unknown key', async () => {
			await request(app.getHttpServer())
				.get(`/api/programs/${program.programId}/circles`)
				.set(
					apiKeyHeaders({
						apiKeyId: '',
						key: 'f'.repeat(32),
						secret: 'f'.repeat(64),
					}),
				)
				.expect(401);
		});

		it('lets a program key read and rotate its own program key', async () => {
			const credentials = await createApiKeyCredentials(
				dataSource,
				program.programId,
			);

			const read = await request(app.getHttpServer())
				.get(programKeysUrl())
				.set(apiKeyHeaders(credentials))
				.expect(200);
			expect(read.body.data.api_key_id).toBe(credentials.apiKeyId);

			const rotated = await request(app.getHttpServer())
				.post(programKeysUrl())
				.set(apiKeyHeaders(credentials))
				.expect(201);
			expect(rotated.body.data.api_key_id).not.toBe(credentials.apiKeyId);

			await request(app.getHttpServer())
				.get(programKeysUrl())
				.set(apiKeyHeaders(credentials))
				.expect(401);
		});

		it.each([userRoleEnum.EDITOR, userRoleEnum.VIEWER])(
			'forbids a program %s from creating or deleting keys, but lets them read',
			async (role) => {
				const credentials = await createApiKeyCredentials(
					dataSource,
					program.programId,
				);
				const user = await createUser(dataSource);
				await addUserToProgram(dataSource, user, program, role);

				await request(app.getHttpServer())
					.post(programKeysUrl())
					.set(...asUser(app, user))
					.expect(403);
				await request(app.getHttpServer())
					.delete(`${programKeysUrl()}/${credentials.apiKeyId}`)
					.set(...asUser(app, user))
					.expect(403);
				await request(app.getHttpServer())
					.get(programKeysUrl())
					.set(...asUser(app, user))
					.expect(200);

				expect(
					await dataSource
						.getRepository(ApiKey)
						.countBy({ programId: program.programId }),
				).toBe(1);
			},
		);

		it("forbids an admin of one program from touching another program's keys", async () => {
			const { program: other } = await createProgram(dataSource);
			const otherKey = await createApiKeyCredentials(
				dataSource,
				other.programId,
			);

			await request(app.getHttpServer())
				.post(programKeysUrl(other))
				.set(...asUser(app, admin))
				.expect(403);
			await request(app.getHttpServer())
				.get(programKeysUrl(other))
				.set(...asUser(app, admin))
				.expect(403);
			await request(app.getHttpServer())
				.delete(`${programKeysUrl(other)}/${otherKey.apiKeyId}`)
				.set(...asUser(app, admin))
				.expect(403);
		});

		it("cannot delete another program's key through its own program's route", async () => {
			const { program: other } = await createProgram(dataSource);
			const otherKey = await createApiKeyCredentials(
				dataSource,
				other.programId,
			);

			await request(app.getHttpServer())
				.delete(`${programKeysUrl()}/${otherKey.apiKeyId}`)
				.set(...asUser(app, admin))
				.expect(400);

			await request(app.getHttpServer())
				.get(`/api/programs/${other.programId}/circles`)
				.set(apiKeyHeaders(otherKey))
				.expect(200);
		});

		it("forbids a program key from reaching another program's keys", async () => {
			const { program: other } = await createProgram(dataSource);
			const credentials = await createApiKeyCredentials(
				dataSource,
				program.programId,
			);

			await request(app.getHttpServer())
				.get(programKeysUrl(other))
				.set(apiKeyHeaders(credentials))
				.expect(403);
			await request(app.getHttpServer())
				.post(programKeysUrl(other))
				.set(apiKeyHeaders(credentials))
				.expect(403);
		});

		it('forbids a promoter member from managing program keys', async () => {
			const { member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await request(app.getHttpServer())
				.post(programKeysUrl())
				.set(...asMember(app, member))
				.expect(403);
			await request(app.getHttpServer())
				.get(programKeysUrl())
				.set(...asMember(app, member))
				.expect(403);
		});
	});

	/**
	 * Promoter keys: created and deleted by the promoter's admin member,
	 * readable by its other members, and scoped to that one promoter.
	 */
	describe('promoter keys', () => {
		let promoter: Promoter;
		let member: Member;

		beforeEach(async () => {
			({ promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			));
		});

		it('lets the promoter admin create a key scoped to the promoter', async () => {
			const response = await request(app.getHttpServer())
				.post(promoterKeysUrl(promoter))
				.set(...asMember(app, member))
				.expect(201);

			const data = response.body.data;
			expect(data).toMatchObject({
				key: expect.stringMatching(/^[0-9a-f]{32}$/),
				secret: expect.stringMatching(/^[0-9a-f]{64}$/),
				status: statusEnum.ACTIVE,
				promoter_id: promoter.promoterId,
			});

			const stored = await dataSource
				.getRepository(ApiKey)
				.findOneByOrFail({ apiKeyId: data.api_key_id });
			expect(stored.programId).toBe(program.programId);
			expect(stored.promoterId).toBe(promoter.promoterId);
			expect(stored.secret).not.toBe(data.secret);
			expect(
				await bcrypt.compare(data.secret as string, stored.secret),
			).toBe(true);
		});

		it('reads the key back without its secret', async () => {
			const created = await request(app.getHttpServer())
				.post(promoterKeysUrl(promoter))
				.set(...asMember(app, member))
				.expect(201);

			const response = await request(app.getHttpServer())
				.get(promoterKeysUrl(promoter))
				.set(...asMember(app, member))
				.expect(200);

			expect(response.body.data).toMatchObject({
				api_key_id: created.body.data.api_key_id,
				promoter_id: promoter.promoterId,
			});
			expect(response.body.data).not.toHaveProperty('secret');
		});

		it('is separate from the program key', async () => {
			const programKey = await createApiKeyCredentials(
				dataSource,
				program.programId,
			);

			await request(app.getHttpServer())
				.get(promoterKeysUrl(promoter))
				.set(...asMember(app, member))
				.expect(404);

			await request(app.getHttpServer())
				.post(promoterKeysUrl(promoter))
				.set(...asMember(app, member))
				.expect(201);

			// Creating the promoter key did not replace the program key.
			const programRead = await request(app.getHttpServer())
				.get(programKeysUrl())
				.set(...asUser(app, admin))
				.expect(200);
			expect(programRead.body.data.api_key_id).toBe(programKey.apiKeyId);
		});

		it('replaces the previous promoter key', async () => {
			const first = await request(app.getHttpServer())
				.post(promoterKeysUrl(promoter))
				.set(...asMember(app, member))
				.expect(201);
			await request(app.getHttpServer())
				.post(promoterKeysUrl(promoter))
				.set(...asMember(app, member))
				.expect(201);

			expect(
				await dataSource
					.getRepository(ApiKey)
					.countBy({ promoterId: promoter.promoterId }),
			).toBe(1);
			await request(app.getHttpServer())
				.get(
					`/api/programs/${program.programId}/promoters/${promoter.promoterId}`,
				)
				.set(apiKeyHeaders(credentialsFrom(first.body.data)))
				.expect(401);
		});

		it('deletes the key, which then stops authenticating', async () => {
			const created = await request(app.getHttpServer())
				.post(promoterKeysUrl(promoter))
				.set(...asMember(app, member))
				.expect(201);
			const credentials = credentialsFrom(created.body.data);

			await request(app.getHttpServer())
				.delete(`${promoterKeysUrl(promoter)}/${credentials.apiKeyId}`)
				.set(...asMember(app, member))
				.expect(200);

			await request(app.getHttpServer())
				.get(
					`/api/programs/${program.programId}/promoters/${promoter.promoterId}`,
				)
				.set(apiKeyHeaders(credentials))
				.expect(401);
		});

		it('rejects an inactive promoter key', async () => {
			const credentials = await createApiKeyCredentials(
				dataSource,
				program.programId,
				promoter.promoterId,
			);
			await dataSource
				.getRepository(ApiKey)
				.update(
					{ apiKeyId: credentials.apiKeyId },
					{ status: statusEnum.INACTIVE },
				);

			await request(app.getHttpServer())
				.get(
					`/api/programs/${program.programId}/promoters/${promoter.promoterId}`,
				)
				.set(apiKeyHeaders(credentials))
				.expect(401);
		});

		it.each([memberRoleEnum.EDITOR, memberRoleEnum.VIEWER])(
			'lets a promoter %s read the key but not create or delete it',
			async (memberRole) => {
				const credentials = await createApiKeyCredentials(
					dataSource,
					program.programId,
					promoter.promoterId,
				);
				const colleague = await createMember(dataSource, program);
				await dataSource.getRepository(PromoterMember).save({
					promoterId: promoter.promoterId,
					memberId: colleague.memberId,
					role: memberRole,
					status: statusEnum.ACTIVE,
				});

				await request(app.getHttpServer())
					.get(promoterKeysUrl(promoter))
					.set(...asMember(app, colleague))
					.expect(200);
				await request(app.getHttpServer())
					.post(promoterKeysUrl(promoter))
					.set(...asMember(app, colleague))
					.expect(403);
				await request(app.getHttpServer())
					.delete(
						`${promoterKeysUrl(promoter)}/${credentials.apiKeyId}`,
					)
					.set(...asMember(app, colleague))
					.expect(403);
			},
		);

		it("forbids a member of another promoter from reading or creating this promoter's key", async () => {
			await createApiKeyCredentials(
				dataSource,
				program.programId,
				promoter.promoterId,
			);
			const { member: outsider } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await request(app.getHttpServer())
				.get(promoterKeysUrl(promoter))
				.set(...asMember(app, outsider))
				.expect(403);
			await request(app.getHttpServer())
				.post(promoterKeysUrl(promoter))
				.set(...asMember(app, outsider))
				.expect(403);
		});

		it("cannot delete another promoter's key through its own promoter route", async () => {
			const { promoter: other } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const otherKey = await createApiKeyCredentials(
				dataSource,
				program.programId,
				other.promoterId,
			);

			await request(app.getHttpServer())
				.delete(`${promoterKeysUrl(promoter)}/${otherKey.apiKeyId}`)
				.set(...asMember(app, member))
				.expect(400);

			expect(
				await dataSource
					.getRepository(ApiKey)
					.existsBy({ apiKeyId: otherKey.apiKeyId }),
			).toBe(true);
		});

		it('lets the program admin issue and read a promoter key', async () => {
			const created = await request(app.getHttpServer())
				.post(promoterKeysUrl(promoter))
				.set(...asUser(app, admin))
				.expect(201);
			expect(created.body.data.promoter_id).toBe(promoter.promoterId);

			await request(app.getHttpServer())
				.get(promoterKeysUrl(promoter))
				.set(...asUser(app, admin))
				.expect(200);
		});

		/**
		 * What a promoter key can reach: its own promoter's resources, and
		 * nothing program-wide or belonging to another promoter.
		 */
		describe('scope', () => {
			let credentials: ApiKeyCredentials;

			beforeEach(async () => {
				credentials = await createApiKeyCredentials(
					dataSource,
					program.programId,
					promoter.promoterId,
				);
			});

			it("reaches its own promoter and the promoter's links", async () => {
				const link = await createLink(dataSource, program, promoter);

				const promoterRead = await request(app.getHttpServer())
					.get(
						`/api/programs/${program.programId}/promoters/${promoter.promoterId}`,
					)
					.set(apiKeyHeaders(credentials))
					.expect(200);
				expect(promoterRead.body.data.promoter_id).toBe(
					promoter.promoterId,
				);

				const links = await request(app.getHttpServer())
					.get(
						`/api/programs/${program.programId}/promoters/${promoter.promoterId}/links`,
					)
					.set(apiKeyHeaders(credentials))
					.expect(200);
				expect(JSON.stringify(links.body.data)).toContain(link.linkId);
			});

			it('can read its own promoter key', async () => {
				const read = await request(app.getHttpServer())
					.get(promoterKeysUrl(promoter))
					.set(apiKeyHeaders(credentials))
					.expect(200);
				expect(read.body.data.api_key_id).toBe(credentials.apiKeyId);
			});

			it('cannot reach another promoter in the same program', async () => {
				const { promoter: other } = await createPromoter(
					dataSource,
					program,
					defaultCircle,
				);
				await createLink(dataSource, program, other);

				await request(app.getHttpServer())
					.get(
						`/api/programs/${program.programId}/promoters/${other.promoterId}`,
					)
					.set(apiKeyHeaders(credentials))
					.expect(403);
				await request(app.getHttpServer())
					.get(
						`/api/programs/${program.programId}/promoters/${other.promoterId}/links`,
					)
					.set(apiKeyHeaders(credentials))
					.expect(403);
				await request(app.getHttpServer())
					.get(promoterKeysUrl(other))
					.set(apiKeyHeaders(credentials))
					.expect(403);
				await request(app.getHttpServer())
					.post(promoterKeysUrl(other))
					.set(apiKeyHeaders(credentials))
					.expect(403);
			});

			it('cannot reach program-wide resources', async () => {
				await request(app.getHttpServer())
					.get(programKeysUrl())
					.set(apiKeyHeaders(credentials))
					.expect(403);
				await request(app.getHttpServer())
					.post(programKeysUrl())
					.set(apiKeyHeaders(credentials))
					.expect(403);
				await request(app.getHttpServer())
					.get(`/api/programs/${program.programId}/circles`)
					.set(apiKeyHeaders(credentials))
					.expect(403);
				await request(app.getHttpServer())
					.get(`/api/programs/${program.programId}/webhooks`)
					.set(apiKeyHeaders(credentials))
					.expect(403);
			});

			it('cannot reach another program', async () => {
				const { program: other, defaultCircle: otherCircle } =
					await createProgram(dataSource);
				const { promoter: otherPromoter } = await createPromoter(
					dataSource,
					other,
					otherCircle,
				);

				await request(app.getHttpServer())
					.get(
						`/api/programs/${other.programId}/promoters/${otherPromoter.promoterId}`,
					)
					.set(apiKeyHeaders(credentials))
					.expect(403);
				await request(app.getHttpServer())
					.get(
						`/api/programs/${other.programId}/promoters/${promoter.promoterId}/api-keys`,
					)
					.set(apiKeyHeaders(credentials))
					.expect(403);
			});
		});
	});
});
