import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { utilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppModule } from './app.module';
import { setupApp } from './app.setup';

async function bootstrap() {

	const app = await NestFactory.create(AppModule, {
		logger: WinstonModule.createLogger({
			level: 'info',
			transports: [
				new winston.transports.Console({
					format: winston.format.combine(
						winston.format.timestamp({
							format: 'YYYY:MM:DD HH:MM:SS',
						}),
						winston.format.ms(),
						utilities.format.nestLike('Cliq', {
							colors: true,
							prettyPrint: true,
							processId: true,
							appName: true,
						}),
					),
				}),
			],
		}),
	});

	setupApp(app);

	await app.listen(process.env.PORT ?? 3000);

	process.on('SIGTERM', async () => {
		console.log('SIGTERM received, shutting down gracefully');
		await app.close();
		process.exit(0);
	});

	process.on('SIGINT', async () => {
		console.log('SIGINT received, shutting down gracefully');
		await app.close();
		process.exit(0);
	});
}

bootstrap().catch((err) => console.log(err));
