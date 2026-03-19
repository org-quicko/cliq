import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ApiKey } from '../entities';
import { statusEnum } from '../enums';
import { ApiKeyConverter } from '../converters/apiKey.converter';
import { UpdateApiKeyDto } from '../dtos';
import winston from 'winston';
import { LoggerFactory } from '@org-quicko/core';

@Injectable()
export class ApiKeyService {
	private logger: winston.Logger = LoggerFactory.getLogger(ApiKeyService.name);
	constructor(
		@InjectRepository(ApiKey)
		private apiKeyRepository: Repository<ApiKey>,

		private apiKeyConverter: ApiKeyConverter,
	) {}

	async generateKey(programId: string, promoterId?: string) {
		this.logger.info(`START: generateKey service`);

		// Delete any existing key for this combination
		if (promoterId) {
			await this.apiKeyRepository.delete({ programId, promoterId });
		} else {
			await this.apiKeyRepository.delete({ programId, promoterId: IsNull() });
		}

		const key = crypto.randomBytes(16).toString('hex');
		const secret = crypto.randomBytes(32).toString('hex');

		const newApiKey = this.apiKeyRepository.create({
			key,
			secret,
			programId,
			promoterId: promoterId ?? null,
		});

		const apiKey = await this.apiKeyRepository.save(newApiKey);
		const apiKeyDto = this.apiKeyConverter.convert(apiKey, secret);

		this.logger.info(`END: generateKey service`);
		return apiKeyDto;
	}

	async getKey(programId: string, promoterId?: string) {
		this.logger.info(`START: getKey service`);

		const where = promoterId
			? { programId, promoterId }
			: { programId, promoterId: IsNull() };

		const apiKey = await this.apiKeyRepository.findOne({ where });
		if (!apiKey) {
			this.logger.warn('Api Key not found');
			throw new NotFoundException('Api key not found');
		}
		this.logger.info('END: getKey service');
		return this.apiKeyConverter.convert(apiKey);
	}

	async updateKey(
		programId: string,
		apiKeyId: string,
		body: UpdateApiKeyDto,
		promoterId?: string,
	) {
		this.logger.info(`START: updateKey service`);

		const keyExists = await this.keyExistsInProgram(programId, apiKeyId, promoterId);

		if (!keyExists) {
			this.logger.error(`Error. Failed to find API key ${apiKeyId} in Program ${programId}`);
			throw new BadRequestException(`Error. Failed to find API key ${apiKeyId} in Program ${programId}`);
		}

		const where = promoterId
			? { programId, apiKeyId, promoterId }
			: { programId, apiKeyId, promoterId: IsNull() };

		await this.apiKeyRepository.update(
			where,
			{ status: body.status, updatedAt: () => `NOW()` },
		);

		this.logger.info(`END: updateKey service`);
	}

	async deleteKey(programId: string, apiKeyId: string, promoterId?: string) {
		this.logger.info(`START: deleteKey service`);

		const keyExists = await this.keyExistsInProgram(programId, apiKeyId, promoterId);

		if (!keyExists) {
			this.logger.error(`Error. Failed to find API key ${apiKeyId} in Program ${programId}`);
			throw new BadRequestException(`Error. Failed to find API key ${apiKeyId} in Program ${programId}`);
		}

		const where = promoterId
			? { programId, apiKeyId, promoterId }
			: { programId, apiKeyId, promoterId: IsNull() };

		await this.apiKeyRepository.delete(where);

		this.logger.info(`END: deleteKey service`);
	}

	async validateKeyAndSecret(
		key: string,
		secret: string,
	): Promise<ApiKey | null> {
		this.logger.info(`START: validateKeyAndSecret service`);

		const apiKey = await this.apiKeyRepository.findOne({
			where: {
				key,
				status: statusEnum.ACTIVE,
			},
		});

		if (!apiKey) return null;

		this.logger.info(`END: validateKeyAndSecret service`);
		const isValid = await bcrypt.compare(secret, apiKey.secret);
		return isValid ? apiKey : null;
	}

	async keyExistsInProgram(programId: string, apiKeyId: string, promoterId?: string) {
		const where = promoterId
			? { programId, apiKeyId, promoterId }
			: { programId, apiKeyId, promoterId: IsNull() };

		const keyResult = await this.apiKeyRepository.findOne({ where });
		return !!keyResult;
	}
}
