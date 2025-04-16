import { BullRootModuleOptions  } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

export const bullMqConfig = (configService: ConfigService): BullRootModuleOptions  => ({
    connection: {
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
    },
});
