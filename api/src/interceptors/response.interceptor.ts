import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map } from 'rxjs/operators';
import { snakeCase } from 'lodash';
import { Observable } from 'rxjs';
import { SKIP_TRANSFORM_KEY } from 'src/decorators/skipTransform.decorator';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response> {
	constructor(private readonly reflector: Reflector) { }

	intercept(
		context: ExecutionContext,
		next: CallHandler,
	): Observable<Response> {
		const skipTransform = this.reflector.getAllAndOverride<boolean>(
			SKIP_TRANSFORM_KEY,
			[context.getHandler(), context.getClass()],
		);

		if (skipTransform) {
			return next.handle();
		}

		return next.handle().pipe(
			map((data) => {
				const response = {
					code: context.switchToHttp().getResponse().statusCode,
					message: data.message,
					data: this.instanceToPlainNested(data.result),
				};

				return response as any;
			}),
		);
	}

	private instanceToPlainNested(obj: any) {
		if (obj instanceof Date) {
			return instanceToPlain(obj);
		}

		if (Array.isArray(obj)) {
			return obj.map(item => this.instanceToPlainNested(item));
		} else if (obj !== null && typeof obj === 'object') {
			return Object.fromEntries(
				Object.entries(obj).map(([key, value]) => [
					snakeCase(key),
					this.instanceToPlainNested(value),
				])
			);
		}

		return instanceToPlain(obj);
	}

}
