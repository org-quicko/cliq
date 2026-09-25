import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app-setup';

/**
 * Tables the migrations create, including the trigger-maintained `*_mv`
 * tables (those are real tables, not materialized views, so they need
 * clearing too). `migrations` and `typeorm_metadata` are left alone.
 */
const TABLES = [
	'api_key',
	'circle',
	'circle_promoter',
	'commission',
	'condition',
	'contact',
	'function',
	'link',
	'link_analytics_day_wise_mv',
	'link_analytics_mv',
	'member',
	'program',
	'program_promoter',
	'program_user',
	'promoter',
	'promoter_analytics_day_wise_mv',
	'promoter_analytics_mv',
	'promoter_member',
	'promoter_webhook',
	'purchase',
	'referral_mv',
	'sign_up',
	'user',
	'webhook',
];

export interface CreateTestAppOptions {
	/**
	 * Apply the production globals from `configureApp`: validation pipe, error
	 * filter, response envelope, `/api` prefix. Required for anything driving
	 * the app over HTTP; skip it when calling providers directly.
	 */
	http?: boolean;
}

/**
 * Boots the real AppModule against the containers started in globalSetup.
 * With `{ http: true }` the app is wired exactly like `main.ts`, so supertest
 * requests go through the same validation, serialization and error handling
 * as production.
 */
export async function createTestApp(
	options: CreateTestAppOptions = {},
): Promise<INestApplication> {
	const moduleFixture = await Test.createTestingModule({
		imports: [AppModule],
	}).compile();

	const app = moduleFixture.createNestApplication({ logger: false });

	if (options.http) {
		configureApp(app);
	}

	await app.init();
	return app;
}

/** Clears all app data without restarting the container. */
export async function truncateAll(dataSource: DataSource): Promise<void> {
	await dataSource.query(
		`TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`,
	);
	// program_summary_mv is a real materialized view; refresh it so it doesn't
	// keep rows for programs that were just truncated.
	await dataSource.query(
		'REFRESH MATERIALIZED VIEW program_summary_mv WITH DATA;',
	);
}
