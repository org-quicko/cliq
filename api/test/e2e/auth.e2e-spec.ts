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
	createMember,
	createProgram,
	createUser,
	uniqueEmail,
} from '../support/factories';
import { Member, User } from '../../src/entities';
import { userRoleEnum } from '../../src/enums';

/**
 * The three ways into the API: program users (JWT, aud program_user),
 * promoter members (JWT, aud promoter_user, scoped to one program) and API
 * keys (x-api-key / x-api-secret).
 */
describe('authentication (e2e)', () => {
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

	describe('POST /users/signup', () => {
		const body = (overrides: Record<string, unknown> = {}) => ({
			email: 'root@example.com',
			password: 'correct-horse',
			first_name: 'Root',
			last_name: 'User',
			...overrides,
		});

		it('makes the first user the platform super admin, with a hashed password', async () => {
			await request(app.getHttpServer())
				.post('/api/users/signup')
				.send(body())
				.expect(201);

			const stored = await dataSource
				.getRepository(User)
				.findOneByOrFail({ email: 'root@example.com' });
			expect(stored.role).toBe(userRoleEnum.SUPER_ADMIN);
			expect(stored.password).not.toBe('correct-horse');
			expect(stored.password.startsWith('$2')).toBe(true);
		});

		it('409s once a super admin exists', async () => {
			await createUser(dataSource, { role: userRoleEnum.SUPER_ADMIN });

			await request(app.getHttpServer())
				.post('/api/users/signup')
				.send(body({ email: 'second@example.com' }))
				.expect(409);
		});

		it('rejects an undeclared property', async () => {
			await request(app.getHttpServer())
				.post('/api/users/signup')
				.send(body({ role: 'super_admin' }))
				.expect(400);
		});
	});

	describe('POST /users/login', () => {
		it('issues a token the guarded routes accept', async () => {
			const email = uniqueEmail('login');
			await createUser(dataSource, { email, password: 'correct-horse' });

			const login = await request(app.getHttpServer())
				.post('/api/users/login')
				.send({ email, password: 'correct-horse' })
				.expect(201);

			expect(typeof login.body.data.access_token).toBe('string');

			await request(app.getHttpServer())
				.get('/api/programs')
				.set('Authorization', `Bearer ${login.body.data.access_token}`)
				.expect(200);
		});

		it('401s on a wrong password', async () => {
			const email = uniqueEmail('login');
			await createUser(dataSource, { email, password: 'correct-horse' });

			await request(app.getHttpServer())
				.post('/api/users/login')
				.send({ email, password: 'wrong' })
				.expect(401);
		});

		it('401s for an unknown email', async () => {
			await request(app.getHttpServer())
				.post('/api/users/login')
				.send({ email: uniqueEmail('nobody'), password: 'wrong' })
				.expect(401);
		});

		it('rejects a token for a user that no longer exists', async () => {
			const user = await createUser(dataSource);
			const header = asUser(app, user);
			await dataSource
				.getRepository(User)
				.delete({ userId: user.userId });

			await request(app.getHttpServer())
				.get('/api/programs')
				.set(...header)
				.expect(401);
		});
	});

	describe('members', () => {
		it('signs up a member into a program and returns a usable token', async () => {
			const { program } = await createProgram(dataSource);
			const email = uniqueEmail('member');

			const signup = await request(app.getHttpServer())
				.post(`/api/programs/${program.programId}/members/signup`)
				.send({
					email,
					password: 'password123',
					first_name: 'Mem',
					last_name: 'Ber',
				})
				.expect(201);

			expect(typeof signup.body.data.access_token).toBe('string');

			const stored = await dataSource
				.getRepository(Member)
				.findOneOrFail({
					where: { email },
					relations: { program: true },
				});
			expect(stored.program.programId).toBe(program.programId);
			expect(stored.password).not.toBe('password123');
		});

		it('logs a member in with the credentials they signed up with', async () => {
			const { program } = await createProgram(dataSource);
			const member = await createMember(dataSource, program, {
				password: 'password123',
			});

			const login = await request(app.getHttpServer())
				.post(`/api/programs/${program.programId}/members/login`)
				.send({ email: member.email, password: 'password123' })
				.expect(201);

			expect(typeof login.body.data.access_token).toBe('string');
		});

		it('scopes member credentials to their own program', async () => {
			const { program } = await createProgram(dataSource);
			const { program: otherProgram } = await createProgram(dataSource);
			const member = await createMember(dataSource, program, {
				password: 'password123',
			});

			const response = await request(app.getHttpServer())
				.post(`/api/programs/${otherProgram.programId}/members/login`)
				.send({ email: member.email, password: 'password123' });

			expect(response.status).toBeGreaterThanOrEqual(400);
			expect(response.body.data?.access_token).toBeUndefined();
		});

		it('does not let a member token act as a program user', async () => {
			const { program } = await createProgram(dataSource);
			const member = await createMember(dataSource, program);

			// Rejected before any ability check: the route resolves its subject
			// from the program-user context (`user_id`), which a member token
			// never carries, so AuthorizationService answers 400 rather than 403.
			await request(app.getHttpServer())
				.get(`/api/programs/${program.programId}/users`)
				.set(...asMember(app, member))
				.expect(400);
		});
	});

	describe('API keys', () => {
		it('authenticates with a valid key and secret', async () => {
			const { program } = await createProgram(dataSource);
			const credentials = await createApiKeyCredentials(
				dataSource,
				program.programId,
			);

			await request(app.getHttpServer())
				.get(`/api/programs/${program.programId}/circles`)
				.set(apiKeyHeaders(credentials))
				.expect(200);
		});

		it('401s on a wrong secret', async () => {
			const { program } = await createProgram(dataSource);
			const credentials = await createApiKeyCredentials(
				dataSource,
				program.programId,
			);

			await request(app.getHttpServer())
				.get(`/api/programs/${program.programId}/circles`)
				.set(apiKeyHeaders({ ...credentials, secret: 'wrong' }))
				.expect(401);
		});

		it('cannot reach another program', async () => {
			const { program } = await createProgram(dataSource);
			const { program: otherProgram } = await createProgram(dataSource);
			const credentials = await createApiKeyCredentials(
				dataSource,
				program.programId,
			);

			await request(app.getHttpServer())
				.get(`/api/programs/${otherProgram.programId}/circles`)
				.set(apiKeyHeaders(credentials))
				.expect(403);
		});
	});
});
