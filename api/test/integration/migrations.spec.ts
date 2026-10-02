import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { createTestApp } from '../support/test-app';
import * as entities from '../../src/entities';

/**
 * The migrations (run once in globalSetup against a fresh postgres:18
 * container) must apply cleanly, and every entity, including the
 * view-backed and trigger-maintained `*_mv` ones, must resolve against the
 * resulting schema. `synchronize` is off in production, so a drift between
 * entity metadata and the migrated schema only shows up as a runtime error.
 */
describe('migrations', () => {
	let app: INestApplication;
	let dataSource: DataSource;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
	});

	afterAll(async () => {
		await app?.close();
	});

	it('leaves no migration pending', async () => {
		const executed = await dataSource.query('SELECT name FROM migrations');
		expect(executed).toHaveLength(16);
	});

	it.each(
		Object.entries(entities).filter(
			([, value]) => typeof value === 'function',
		),
	)('%s resolves against the migrated schema', async (_name, entity) => {
		await expect(
			dataSource
				.getRepository(entity as EntityTarget<ObjectLiteral>)
				.find({ take: 1 }),
		).resolves.toBeInstanceOf(Array);
	});
});
