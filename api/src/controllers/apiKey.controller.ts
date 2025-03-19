import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiKeyService } from '../services/apiKey.service';
import { LoggerService } from '../services/logger.service';
import { AuthGuard } from '../guards/auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { ApiKey } from '../entities';
import { UpdateApiKeyDto } from 'src/dtos/apiKey.dto';
import { statusEnum } from 'src/enums';

@ApiTags('ApiKey')
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('/programs/:program_id/apikeys')
export class ApiKeyController {
	constructor(
		private apiKeyService: ApiKeyService,
		private logger: LoggerService,
	) {}

	@ApiResponse({ status: 201, description: 'Created' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('create', ApiKey)
	@Post()
	async generateKey(
		@Headers('user_id') userId: string,
		@Param('program_id') programId: string,
	) {
		this.logger.info(`START: generateKey controller`);

		const result = await this.apiKeyService.generateKey(programId, userId);

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
	@Patch(':api_key_id')
	async updateKey(
		@Param('program_id') programId: string,
		@Param('api_key_id') apiKeyId: string,
		@Body() body: UpdateApiKeyDto,
	) {
		this.logger.info(`START: revokeKey controller`);

		await this.apiKeyService.updateKey(programId, apiKeyId, body);
		const keyStatusAction =
			body.status === statusEnum.ACTIVE ? 'reactivated' : 'revoked';

		this.logger.info(`START: revokeKey controller`);
		return { message: `Successfully ${keyStatusAction} api key.` };
	}

	@ApiResponse({ status: 204, description: 'No Content' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('delete', ApiKey)
	@Delete(':api_key_id')
	async deleteKey(
		@Param('program_id') programId: string,
		@Param('api_key_id') apiKeyId: string,
	) {
		this.logger.info(`START: deleteKey controller`);

		await this.apiKeyService.deleteKey(programId, apiKeyId);

		this.logger.info(`START: deleteKey controller`);
		return { message: `Successfully deleted api key.` };
	}

	@ApiResponse({ status: 200, description: 'OK' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 403, description: 'Unauthorized' })
	@Permissions('read', ApiKey)
	@Get()
	async getAllKeys(@Param('program_id') programId: string) {
		this.logger.info(`START: getAllKeys controller`);

		const result = await this.apiKeyService.getAllKeys(programId);

		this.logger.info(`END: getAllKeys controller`);
		return {
			message: `Successfully fetched all API keys of Program ${programId}.`,
			result,
		};
	}
}
