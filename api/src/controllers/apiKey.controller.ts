import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiKeyService } from '../services/apiKey.service';
import { Permissions } from '../decorators/permissions.decorator';
import { ApiKey } from '../entities';
import { statusEnum } from 'src/enums';
import { UpdateApiKeyDto } from 'src/dtos';
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
	@Post('apikeys')
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
	@Permissions('update', ApiKey)
	@Patch('apikeys/:api_key_id')
	async updateKey(
		@Param('program_id') programId: string,
		@Param('api_key_id') apiKeyId: string,
		@Body() body: UpdateApiKeyDto,
	) {
		this.logger.info(`START: updateKey controller`);

		await this.apiKeyService.updateKey(programId, apiKeyId, body);
		const keyStatusAction =
			body.status === statusEnum.ACTIVE ? 'reactivated' : 'revoked';

		this.logger.info(`END: updateKey controller`);
		return { message: `Successfully ${keyStatusAction} api key.` };
	}

	@ApiResponse({ status: 204, description: 'No Content' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('delete', ApiKey)
	@Delete('apikeys/:api_key_id')
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
	@Get('apikeys')
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
	@Post('promoters/:promoter_id/apikeys')
	async generatePromoterKey(
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
	) {
		this.logger.info(`START: generatePromoterKey controller`);

		const result = await this.apiKeyService.generateKey(programId, promoterId);

		this.logger.info(`END: generatePromoterKey controller`);
		return {
			message: `Successfully generated API key for Promoter ${promoterId} in Program ${programId}`,
			result,
		};
	}

	@ApiResponse({ status: 200, description: 'OK' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('read', ApiKey)
	@Get('promoters/:promoter_id/apikeys')
	async getPromoterKey(
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
	) {
		this.logger.info(`START: getPromoterKey controller`);

		const result = await this.apiKeyService.getKey(programId, promoterId);

		this.logger.info(`END: getPromoterKey controller`);
		return {
			message: `Successfully fetched API key for Promoter ${promoterId} in Program ${programId}.`,
			result,
		};
	}

	@ApiResponse({ status: 204, description: 'No Content' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('update', ApiKey)
	@Patch('promoters/:promoter_id/apikeys/:api_key_id')
	async updatePromoterKey(
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Param('api_key_id') apiKeyId: string,
		@Body() body: UpdateApiKeyDto,
	) {
		this.logger.info(`START: updatePromoterKey controller`);

		await this.apiKeyService.updateKey(programId, apiKeyId, body, promoterId);
		const keyStatusAction =
			body.status === statusEnum.ACTIVE ? 'reactivated' : 'revoked';

		this.logger.info(`END: updatePromoterKey controller`);
		return { message: `Successfully ${keyStatusAction} promoter api key.` };
	}

	@ApiResponse({ status: 204, description: 'No Content' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('delete', ApiKey)
	@Delete('promoters/:promoter_id/apikeys/:api_key_id')
	async deletePromoterKey(
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Param('api_key_id') apiKeyId: string,
	) {
		this.logger.info(`START: deletePromoterKey controller`);

		await this.apiKeyService.deleteKey(programId, apiKeyId, promoterId);

		this.logger.info(`END: deletePromoterKey controller`);
		return { message: `Successfully deleted promoter api key.` };
	}
}
