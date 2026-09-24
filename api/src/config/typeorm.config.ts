import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ProgramSubscriber } from '../subscribers/program.subscriber';
import { getDatabaseConnectionOptions } from './database.config';

export const typeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
    ...getDatabaseConnectionOptions(configService),
    autoLoadEntities: true,
    subscribers: [ProgramSubscriber],
    synchronize: configService.get('NODE_ENV') !== 'production',
    logging: configService.get('NODE_ENV') === 'production' ? ['info'] : true,
    poolSize: 20,
    maxQueryExecutionTime: 30000,
    connectTimeoutMS: 30000,
});
