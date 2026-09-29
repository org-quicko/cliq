import { ConfigService } from '@nestjs/config';
import { describe, it, expect } from 'vitest';
import { getDatabaseConnectionOptions } from './database.config';

const configWith = (env: Record<string, string>) => new ConfigService(env);

describe('getDatabaseConnectionOptions', () => {
	it('defaults to the public schema', () => {
		const options = getDatabaseConnectionOptions(
			configWith({ DB_URL: 'postgres://u:p@h/db' }),
		);

		expect(options.schema).toBe('public');
		expect(options.extra).toEqual({
			options: '-c search_path=public',
			min: 0,
		});
		expect(options.ssl).toBeUndefined();
	});

	it('puts a custom schema first on the search_path, keeping public as a fallback', () => {
		const options = getDatabaseConnectionOptions(
			configWith({ DB_URL: 'postgres://u:p@h/db', DB_SCHEMA: 'cliq' }),
		);

		expect(options.schema).toBe('cliq');
		expect(options.extra).toEqual({
			options: '-c search_path=cliq,public',
			min: 0,
		});
	});

	it('enables TLS without certificate verification unless asked', () => {
		expect(
			getDatabaseConnectionOptions(configWith({ DB_SSL: 'true' })).ssl,
		).toEqual({ rejectUnauthorized: false });

		expect(
			getDatabaseConnectionOptions(
				configWith({
					DB_SSL: 'true',
					DB_SSL_REJECT_UNAUTHORIZED: 'true',
				}),
			).ssl,
		).toEqual({ rejectUnauthorized: true });
	});

	it('defaults the pool to max 5 / min 0 and reads overrides from env', () => {
		const defaults = getDatabaseConnectionOptions(configWith({}));
		expect(defaults.poolSize).toBe(5);
		expect(defaults.extra).toMatchObject({ min: 0 });

		const custom = getDatabaseConnectionOptions(
			configWith({ DB_POOL_MAX: '20', DB_POOL_MIN: '2' }),
		);
		expect(custom.poolSize).toBe(20);
		expect(custom.extra).toMatchObject({ min: 2 });
	});

	it('falls back on invalid pool values and caps min at max', () => {
		const invalid = getDatabaseConnectionOptions(
			configWith({ DB_POOL_MAX: 'abc', DB_POOL_MIN: '-1' }),
		);
		expect(invalid.poolSize).toBe(5);
		expect(invalid.extra).toMatchObject({ min: 0 });

		const capped = getDatabaseConnectionOptions(
			configWith({ DB_POOL_MAX: '3', DB_POOL_MIN: '9' }),
		);
		expect(capped.extra).toMatchObject({ min: 3 });
	});

	it('ignores undefined where-values, as TypeORM 0.3 did', () => {
		// TypeORM 1.x throws on `undefined` in a where clause by default;
		// optional filters built as `{ name }` rely on it being dropped.
		expect(
			getDatabaseConnectionOptions(configWith({}))
				.invalidWhereValuesBehavior,
		).toEqual({ undefined: 'ignore' });
	});
});
