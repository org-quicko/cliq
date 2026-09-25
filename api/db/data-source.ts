import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { getDatabaseConnectionOptions } from '../src/config/database.config';
import { ensureSchemaExists } from '../src/config/migration-utils';

const configService = new ConfigService();

const options: DataSourceOptions = {
	...getDatabaseConnectionOptions(configService),
	synchronize: false,
	logging: configService.get('NODE_ENV') === 'production' ? ['info'] : true,
	poolSize: 10,
	connectTimeoutMS: 2000,
	maxQueryExecutionTime: 5000,
};

export const AppDataSource = new DataSource({
	...options,
	entities: ['dist/src/entities/*.js'],
	migrations: ['dist/db/migrations/*.{js,ts}'],
});

// The TypeORM CLI (migration:run/generate/revert) calls AppDataSource.initialize() directly,
// so DB_SCHEMA must be created here, before that connection is used.
const initialize = AppDataSource.initialize.bind(AppDataSource);
AppDataSource.initialize = async () => {
	await ensureSchemaExists(options);
	return initialize();
};
