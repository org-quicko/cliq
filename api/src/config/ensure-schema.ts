import { Client } from 'pg';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

/**
 * Postgres does not create a non-"public" schema on demand: TypeORM (both `synchronize`
 * and `migration:run`) fails with `schema "<name>" does not exist` if DB_SCHEMA hasn't
 * been created yet. This connects independently of the configured schema (connecting
 * doesn't require the schema to exist) and creates it if missing.
 */
export const ensureSchemaExists = async ({
    url,
    schema,
}: Pick<PostgresConnectionOptions, 'url' | 'schema'>): Promise<void> => {
    if (!schema || schema === 'public') {
        return;
    }

    const client = new Client({ connectionString: url });

    await client.connect();

    try {
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema.replace(/"/g, '""')}"`);
    } finally {
        await client.end();
    }
};
