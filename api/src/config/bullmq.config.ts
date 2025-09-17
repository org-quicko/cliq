import { BullRootModuleOptions } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

export const bullMqConfig = (configService: ConfigService): BullRootModuleOptions => ({
	connection: {
		host: configService.get<string>('REDIS_HOST'),
		port: configService.get<number>('REDIS_PORT'),
		// Add connection pool management
		retryDelayOnFailover: 1000,
		enableReadyCheck: false,
		lazyConnect: true,
		keepAlive: 30000,
		// Memory management
		family: 4,
		connectTimeout: 30000,
		commandTimeout: 30000,
	},
	
	defaultJobOptions: {
		removeOnComplete: 10,
		removeOnFail: 5,
		attempts: 3,
		backoff: {
			type: 'exponential',
			delay: 2000,
		},
	},
} as BullRootModuleOptions);
