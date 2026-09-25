import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from '../support/test-app';

/**
 * The globals `configureApp` applies to every request, checked on the paths
 * that need no data: the root redirect, the `/api` prefix, the error envelope,
 * CORS and the auth wall.
 */
describe('app (e2e)', () => {
	let app: INestApplication<App>;

	beforeAll(async () => {
		app = await createTestApp({ http: true });
	});

	afterAll(async () => {
		await app?.close();
	});

	it('redirects / to the admin portal', async () => {
		const response = await request(app.getHttpServer())
			.get('/')
			.expect(302);

		expect(response.headers.location).toBe('/admin');
	});

	it('only serves the API under /api', async () => {
		await request(app.getHttpServer())
			.post('/users/login')
			.send({ email: 'a@b.c', password: 'x' })
			.expect(404);
	});

	it('rejects a guarded route without credentials, using the error envelope', async () => {
		const response = await request(app.getHttpServer())
			.get('/api/programs')
			.expect(401);

		expect(response.body).toMatchObject({
			code: 401,
			message: 'Missing authentication token',
		});
	});

	it('rejects a malformed bearer token', async () => {
		await request(app.getHttpServer())
			.get('/api/programs')
			.set('Authorization', 'Bearer not-a-jwt')
			.expect(401);
	});

	it('allows cross-origin requests and exposes Content-Disposition', async () => {
		const response = await request(app.getHttpServer())
			.options('/api/programs')
			.set('Origin', 'https://portal.example.com')
			.set('Access-Control-Request-Method', 'GET');

		expect(response.headers['access-control-allow-origin']).toBe('*');

		const preflighted = await request(app.getHttpServer())
			.get('/api/programs')
			.set('Origin', 'https://portal.example.com');
		expect(preflighted.headers['access-control-expose-headers']).toBe(
			'Content-Disposition',
		);
	});
});
