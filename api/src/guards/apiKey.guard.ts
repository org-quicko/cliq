import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ApiKeyService } from "src/services/apiKey.service";
import { Request } from "express";
import winston from "winston";
import { LoggerFactory } from "@org-quicko/core";

@Injectable()
export class ApiKeyGuard implements CanActivate {
    private logger : winston.Logger = LoggerFactory.getLogger(ApiKeyGuard.name);
    constructor(
        private apiKeyService: ApiKeyService,
    ) { }

    async canActivate(context: ExecutionContext) {
        this.logger.info(`START: canActivate function - ApiKeyGuard`);

        const request: Request = context.switchToHttp().getRequest();

        const key: string = request.headers['x-api-key'] as string;
        const secret: string = request.headers['x-api-secret'] as string;

        const apiKey = await this.apiKeyService.validateKeyAndSecret(
            key,
            secret,
        );
        if (apiKey) {
            request.headers.api_key_id = apiKey.apiKeyId;
            request.headers.program_id = apiKey.programId;
            if (apiKey.promoterId) {
                request.headers.promoter_id = apiKey.promoterId;
            }
            this.logger.info(`END: canActivate function - ApiKeyGuard (authenticated via API Key)`);
            return true;
        }
        this.logger.error('Invalid API key or secret.');
        throw new UnauthorizedException('Invalid API key or secret.');
    }
}
