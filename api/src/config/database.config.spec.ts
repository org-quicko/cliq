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
		expect(options.extra).toEqual({ options: '-c search_path=public' });
		expect(options.ssl).toBeUndefined();
	});

	it('puts a custom schema first on the search_path, keeping public as a fallback', () => {
		const options = getDatabaseConnectionOptions(
			configWith({ DB_URL: 'postgres://u:p@h/db', DB_SCHEMA: 'cliq' }),
		);

		expect(options.schema).toBe('cliq');
		expect(options.extra).toEqual({
			options: '-c search_path=cliq,public',
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

	it('ignores undefined where-values, as TypeORM 0.3 did', () => {
		// TypeORM 1.x throws on `undefined` in a where clause by default;
		// optional filters built as `{ name }` rely on it being dropped.
		expect(
			getDatabaseConnectionOptions(configWith({}))
				.invalidWhereValuesBehavior,
		).toEqual({ undefined: 'ignore' });
	});
});
