import { ConfigService } from '@nestjs/config';
import type { DataSourceOptions } from 'typeorm';

export const getDatabaseConnectionOptions = (
    configService: ConfigService,
): Pick<Extract<DataSourceOptions, { type: 'postgres' }>, 'type' | 'url' | 'schema' | 'extra' | 'ssl' | 'invalidWhereValuesBehavior'> => {
    const schema = configService.get<string>('DB_SCHEMA') || 'public';
    // 'public' stays in the search_path as a fallback: some historical migrations hardcode
    // "public".<type> for enum types, so they must remain resolvable when DB_SCHEMA is customized.
    const searchPath = schema === 'public' ? 'public' : `${schema},public`;
    const sslEnabled = configService.get<string>('DB_SSL') === 'true';

    return {
        type: 'postgres',
        url: configService.get<string>('DB_URL'),
        schema,
        // TypeORM 1.x throws by default when a `where` clause contains an `undefined`
        // value (0.3.x silently dropped the condition). Controllers build optional filter
        // objects with shorthand properties (e.g. `{ name }`) that are `undefined`, not
        // absent, when a query param isn't supplied, so keep the 0.3.x behavior globally.
        invalidWhereValuesBehavior: { undefined: 'ignore' },
        // Sets the connection's search_path so raw/unqualified SQL (e.g. materialized view refreshes)
        // also targets the configured schema, not just TypeORM-generated entity queries.
        extra: { options: `-c search_path=${searchPath}` },
        // Managed Postgres (RDS/Aurora, etc.) typically requires TLS. Node doesn't
        // trust Amazon's RDS CA out of the box, so verification is off by default;
        // set DB_SSL_REJECT_UNAUTHORIZED=true once a trusted CA is configured.
        ssl: sslEnabled
            ? { rejectUnauthorized: configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED') === 'true' }
            : undefined,
    };
};
