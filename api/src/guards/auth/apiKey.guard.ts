import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { LoggerService } from 'src/services/logger.service';
import { ApiKeyService } from '../../services/apiKey.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
	constructor(
		private logger: LoggerService,
		private apiKeyService: ApiKeyService,
	) {}

	// TODO: merge with AuthGuard
	async canActivate(context: ExecutionContext) {
		this.logger.info(`START: canActivate function- ApiKeyGuard guard`);

		const request: Request = context.switchToHttp().getRequest();

		const key: string = request.headers['x-api-key'] as string;
		const secret: string = request.headers['x-api-secret'] as string;

		if (!(key && secret)) {
			this.logger.error('Missing API key or secret.');
			throw new UnauthorizedException('Missing API key or secret.');
		}

		const apiKey = await this.apiKeyService.validateKeyAndSecret(
			key,
			secret,
		);

		if (!apiKey) {
			this.logger.error('Invalid API key or secret.');
			throw new UnauthorizedException('Invalid API key or secret.');
		}

		// attaching the api key to the request headers
		request.headers.api_key_id = apiKey.apiKeyId;

		this.logger.info(`END: canActivate function- ApiKeyGuard guard`);
		return true;
	}
}
