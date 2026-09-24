import { ConfigService } from '@nestjs/config';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export const getDatabaseConnectionOptions = (
    configService: ConfigService,
): Pick<PostgresConnectionOptions, 'type' | 'url' | 'schema' | 'extra'> => {
    const schema = configService.get<string>('DB_SCHEMA') || 'public';
    // 'public' stays in the search_path as a fallback: some historical migrations hardcode
    // "public".<type> for enum types, so they must remain resolvable when DB_SCHEMA is customized.
    const searchPath = schema === 'public' ? 'public' : `${schema},public`;

    return {
        type: 'postgres',
        url: configService.get<string>('DB_URL'),
        schema,
        // Sets the connection's search_path so raw/unqualified SQL (e.g. materialized view refreshes)
        // also targets the configured schema, not just TypeORM-generated entity queries.
        extra: { options: `-c search_path=${searchPath}` },
    };
};
