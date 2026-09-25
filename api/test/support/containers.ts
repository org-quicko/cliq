import {
	PostgreSqlContainer,
	StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { DataSource } from 'typeorm';
import * as entities from '../../src/entities';
import { CreateTypeormMetadata1747141132451 } from '../../db/migrations/1747141132451-create-typeorm-metadata';
import { Migrations1747141132471 } from '../../db/migrations/1747141132471-initial-migration';
import { UpdateConditions1750396593271 } from '../../db/migrations/1750396593271-update-conditions';
import { PurchaseLinkId1750508322043 } from '../../db/migrations/1750508322043-purchase-link-id';
import { RemoveMaterializedViews1756737141436 } from '../../db/migrations/1756737141436-remove-materialized-views';
import { AddIndexes1757073287472 } from '../../db/migrations/1756737184827-add-indexes';
import { AddReferralMvTable1756737284827 } from '../../db/migrations/1756737284827-add-referral-mv-table';
import { AddLinkAnalyticMv1756740127762 } from '../../db/migrations/1756740127762-add-link-analytics-mv';
import { AddPromoterAnalyticsMv1756740245765 } from '../../db/migrations/1756740245765-add-promoter-analytics-mv';
import { AddTriggersForLinks1756834338064 } from '../../db/migrations/1756834338064-add-triggers-for-links';
import { AddCommissionTypeColumns1756834338065 } from '../../db/migrations/1756834338065-add-commission-type-columns';
import { CreateProgramSummaryView1770111576424 } from '../../db/migrations/1770111576424-CreateProgramSummaryView';
import { AddReferralSearchVector1772000000000 } from '../../db/migrations/1772709666051-AddReferralSearchVector';
import { AddPromoterIdColumn1773818081857 } from '../../db/migrations/1773818081857-add-promoterId-column';
import { CreatePromoterWebhookEntity1774875240037 } from '../../db/migrations/1774875240037-CreatePromoterWebhookEntity';
import { AddExternalIdAndRenameColumns1774876800000 } from '../../db/migrations/1774876800000-AddExternalIdAndRenameColumns';

let postgres: StartedPostgreSqlContainer | undefined;
let redis: StartedRedisContainer | undefined;

// TypeORM's file-glob migration loader does its own dynamic import() of the
// matched files at runtime, bypassing Vite's transform pipeline. Importing the
// classes statically lets Vite transform them like any other module; TypeORM
// orders them by each class's embedded timestamp, so array order is irrelevant.
const migrations = [
	CreateTypeormMetadata1747141132451,
	Migrations1747141132471,
	UpdateConditions1750396593271,
	PurchaseLinkId1750508322043,
	RemoveMaterializedViews1756737141436,
	AddIndexes1757073287472,
	AddReferralMvTable1756737284827,
	AddLinkAnalyticMv1756740127762,
	AddPromoterAnalyticsMv1756740245765,
	AddTriggersForLinks1756834338064,
	AddCommissionTypeColumns1756834338065,
	CreateProgramSummaryView1770111576424,
	AddReferralSearchVector1772000000000,
	AddPromoterIdColumn1773818081857,
	CreatePromoterWebhookEntity1774875240037,
	AddExternalIdAndRenameColumns1774876800000,
];

/**
 * Vitest globalSetup: starts one postgres:18 and one redis container for the
 * whole e2e/integration run, runs the real TypeORM migrations, and exposes
 * both through the same env vars the app reads via ConfigService (DB_URL,
 * REDIS_HOST, REDIS_PORT). Redis is needed because BullModule connects on
 * boot and the webhook consumer runs inside the app.
 */
export default async function setup() {
	[postgres, redis] = await Promise.all([
		new PostgreSqlContainer('postgres:18').start(),
		new RedisContainer('redis:7').start(),
	]);

	const databaseUrl = postgres.getConnectionUri();
	process.env.DB_URL = databaseUrl;
	process.env.REDIS_HOST = redis.getHost();
	process.env.REDIS_PORT = String(redis.getMappedPort(6379));
	delete process.env.DB_SCHEMA;
	delete process.env.DB_SSL;

	const dataSource = new DataSource({
		type: 'postgres',
		url: databaseUrl,
		// Registering the entities lets TypeORM record the view definitions in
		// typeorm_metadata as the migrations create them.
		entities: Object.values(entities),
		migrations,
	});

	await dataSource.initialize();
	await dataSource.runMigrations();
	await dataSource.destroy();

	return async () => {
		await Promise.all([postgres?.stop(), redis?.stop()]);
	};
}
