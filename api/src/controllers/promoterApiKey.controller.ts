import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiKeyService } from '../services/apiKey.service';
import { Permissions } from '../decorators/permissions.decorator';
import { ApiKey } from '../entities';
import { statusEnum } from 'src/enums';
import { UpdateApiKeyDto } from 'src/dtos';
import { LoggerFactory } from '@org-quicko/core';
import winston from 'winston';

@ApiTags('PromoterApiKey')
@Controller('/programs/:program_id/promoters/:promoter_id/apikeys')
export class PromoterApiKeyController {
	private logger: winston.Logger = LoggerFactory.getLogger(PromoterApiKeyController.name);
	constructor(
		private apiKeyService: ApiKeyService,
	) {}

	@ApiResponse({ status: 201, description: 'Created' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('create', ApiKey)
	@Post()
	async generateKey(
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
	) {
		this.logger.info(`START: generateKey controller`);

		const result = await this.apiKeyService.generateKey(programId, promoterId);

		this.logger.info(`END: generateKey controller`);
		return {
			message: `Successfully generated API key for Promoter ${promoterId} in Program ${programId}`,
			result,
		};
	}

	@ApiResponse({ status: 200, description: 'OK' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('read', ApiKey)
	@Get()
	async getKey(
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
	) {
		this.logger.info(`START: getKey controller`);

		const result = await this.apiKeyService.getKey(programId, promoterId);

		this.logger.info(`END: getKey controller`);
		return {
			message: `Successfully fetched API key for Promoter ${promoterId} in Program ${programId}.`,
			result,
		};
	}

	@ApiResponse({ status: 200, description: 'OK' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('update', ApiKey)
	@Patch(':api_key_id')
	async updateKey(
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Param('api_key_id') apiKeyId: string,
		@Body() body: UpdateApiKeyDto,
	) {
		this.logger.info(`START: updateKey controller`);

		await this.apiKeyService.updateKey(programId, apiKeyId, body, promoterId);
		const keyStatusAction =
			body.status === statusEnum.ACTIVE ? 'reactivated' : 'revoked';

		this.logger.info(`END: updateKey controller`);
		return { message: `Successfully ${keyStatusAction} promoter api key.` };
	}

	@ApiResponse({ status: 200, description: 'OK' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('delete', ApiKey)
	@Delete(':api_key_id')
	async deleteKey(
		@Param('program_id') programId: string,
		@Param('promoter_id') promoterId: string,
		@Param('api_key_id') apiKeyId: string,
	) {
		this.logger.info(`START: deleteKey controller`);

		await this.apiKeyService.deleteKey(programId, apiKeyId, promoterId);

		this.logger.info(`END: deleteKey controller`);
		return { message: `Successfully deleted promoter api key.` };
	}
}
