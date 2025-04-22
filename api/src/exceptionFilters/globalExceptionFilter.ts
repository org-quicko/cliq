import {
	Catch,
	ExceptionFilter,
	ArgumentsHost,
	HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	catch(exception: HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const status = exception.getStatus();

		const exceptionResponse = exception.getResponse();

		let message = exception.message;

		if (
			typeof exceptionResponse === 'object' && 
			exceptionResponse['validationErrors']
		) {
			const messages: string[] = [];
			for (const validationError of exceptionResponse['validationErrors']) {
				messages.push(Object.values(validationError['constraints'] as object)[0] as string);
			}

			message = `Validation errors: ${messages.join(', ')}.`;
		}

		response.status(status).json({
			code: status,
			message,
			error: exception.cause,
		});
	}
}
