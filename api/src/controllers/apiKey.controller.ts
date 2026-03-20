import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiKeyService } from '../services/apiKey.service';
import { Permissions } from '../decorators/permissions.decorator';
import { ApiKey } from '../entities';
import { LoggerFactory } from '@org-quicko/core';
import winston from 'winston';

@ApiTags('ApiKey')
@Controller('/programs/:program_id')
export class ApiKeyController {
	private logger: winston.Logger = LoggerFactory.getLogger(ApiKeyController.name);
	constructor(
		private apiKeyService: ApiKeyService,
	) {}

	@ApiResponse({ status: 201, description: 'Created' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('create', ApiKey)
	@Post('api-keys')
	async generateKey(
		@Param('program_id') programId: string,
	) {
		this.logger.info(`START: generateKey controller`);

		const result = await this.apiKeyService.generateKey(programId);

		this.logger.info(`END: generateKey controller`);
		return {
			message: `Successfully generated api key and secret for program ${programId}`,
			result,
		};
	}

	@ApiResponse({ status: 204, description: 'No Content' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('delete', ApiKey)
	@Delete('api-keys/:api_key_id')
	async deleteKey(
		@Param('program_id') programId: string,
		@Param('api_key_id') apiKeyId: string,
	) {
		this.logger.info(`START: deleteKey controller`);

		await this.apiKeyService.deleteKey(programId, apiKeyId);

		this.logger.info(`END: deleteKey controller`);
		return { message: `Successfully deleted api key.` };
	}

	@ApiResponse({ status: 200, description: 'OK' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('read', ApiKey)
	@Get('api-keys')
	async getKey(@Param('program_id') programId: string) {
		this.logger.info(`START: getKey controller`);

		const result = await this.apiKeyService.getKey(programId);

		this.logger.info(`END: getKey controller`);
		return {
			message: `Successfully fetched API key of Program ${programId}.`,
			result,
		};
	}


	@ApiResponse({ status: 201, description: 'Created' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('create', ApiKey)
	@Post('promoters/:promoter_id/api-keys')
	async generatePromoterApiKey(
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
	) {
		this.logger.info(`START: generatePromoterApiKey controller`);

		const result = await this.apiKeyService.generateKey(programId, promoterId);

		this.logger.info(`END: generatePromoterApiKey controller`);
		return {
			message: `Successfully generated API key for Promoter ${promoterId} in Program ${programId}`,
			result,
		};
	}

	@ApiResponse({ status: 200, description: 'OK' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('read', ApiKey)
	@Get('promoters/:promoter_id/api-keys')
	async getPromoterApiKey(
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
	) {
		this.logger.info(`START: getPromoterApiKey controller`);

		const result = await this.apiKeyService.getKey(programId, promoterId);

		this.logger.info(`END: getPromoterApiKey controller`);
		return {
			message: `Successfully fetched API key for Promoter ${promoterId} in Program ${programId}.`,
			result,
		};
	}

	@ApiResponse({ status: 204, description: 'No Content' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('delete', ApiKey)
	@Delete('promoters/:promoter_id/api-keys/:api_key_id')
	async deletePromoterApiKey(
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Param('api_key_id') apiKeyId: string,
	) {
		this.logger.info(`START: deletePromoterApiKey controller`);

		await this.apiKeyService.deleteKey(programId, apiKeyId, promoterId);

		this.logger.info(`END: deletePromoterApiKey controller`);
		return { message: `Successfully deleted promoter api key.` };
	}
}
