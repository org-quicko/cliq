import 'reflect-metadata';
import {
	BadRequestException,
	ClassSerializerInterceptor,
	INestApplication,
	ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './exceptionFilters/globalExceptionFilter';
import { TransformInterceptor } from './interceptors/response.interceptor';

/**
 * Every global the HTTP surface depends on: the `/` redirect, validation, the
 * error shape, the `{ code, message, data }` envelope, CORS and the `/api`
 * prefix.
 *
 * This lives apart from `main.ts` so the test harness boots an app configured
 * exactly like production. A Nest app created via
 * `Test.createTestingModule(...).createNestApplication()` has none of these
 * globals unless they're applied here.
 */
export function setupApp(app: INestApplication): INestApplication {
	app.getHttpAdapter()
		.getInstance()
		.use((req: any, res: any, next: any) => {
			if (req.method === 'GET' && req.path === '/') {
				return res.redirect(302, '/admin');
			}
			next();
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
				);
				return new BadRequestException({
					validationErrors: errors,
				});
			},
		}),
	);

	app.setGlobalPrefix('/api');

	app.enableCors({
		exposedHeaders: ['Content-Disposition'],
		origin: '*',
	});

	app.useGlobalFilters(new HttpExceptionFilter());

	app.useGlobalInterceptors(
		new ClassSerializerInterceptor(app.get(Reflector)),
		new TransformInterceptor(app.get(Reflector)),
	);

	return app;
}
