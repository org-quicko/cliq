import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import {
	BadRequestException,
	ClassSerializerInterceptor,
	ValidationPipe,
} from '@nestjs/common';
import { utilities, WinstonModule } from 'nest-winston';
import { useContainer } from 'class-validator';
import * as winston from 'winston';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './exceptionFilters/globalExceptionFilter';
import { TransformInterceptor } from './interceptors/response.interceptor';

async function bootstrap() {

	const app = await NestFactory.create(AppModule, {
		snapshot: true,
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

	useContainer(app.select(AppModule), { fallbackOnErrors: true });

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
			transformOptions: { enableImplicitConversion: true },
			exceptionFactory: (errors) => {
				console.error(
					'Validation Errors:',
					JSON.stringify(errors, null, 2),
				); // 🔥 Logs errors in detail
				return new BadRequestException(errors);
			},
		}),
	);

	app.enableCors();

	app.useGlobalFilters(new HttpExceptionFilter());

	app.useGlobalInterceptors(
		new ClassSerializerInterceptor(app.get(Reflector)),
		new TransformInterceptor(app.get(Reflector)),
	);

	await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => console.log(err));
