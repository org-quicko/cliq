import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ApiKey } from '../entities';
import { LoggerService } from './logger.service';
import { statusEnum } from '../enums';
import { ProgramService } from './program.service';
import { ApiKeyConverter } from '../converters/apiKey.converter';
import { UpdateApiKeyDto } from '../dtos';

@Injectable()
export class ApiKeyService {
	constructor(
		@InjectRepository(ApiKey)
		private apiKeyRepository: Repository<ApiKey>,

		private apiKeyConverter: ApiKeyConverter,

		private logger: LoggerService,
	) {}

	async generateKey(programId: string) {
		this.logger.info(`START: generateKey service`);

		const key = crypto.randomBytes(16).toString('hex');
		const secret = crypto.randomBytes(32).toString('hex');

		const newApiKey = this.apiKeyRepository.create({
			key,
			secret,
			programId,
		});

		const apiKey = await this.apiKeyRepository.save(newApiKey);
		const apiKeyDto = this.apiKeyConverter.convert(apiKey, secret);

		this.logger.info(`END: generateKey service`);
		return apiKeyDto;
	}

	async getAllKeys(programId: string) {
		this.logger.info(`START: getAllKeys service`);

		const apiKeys = await this.apiKeyRepository.find({
			where: { programId },
		});
		const apiKeysDto = apiKeys.map((apiKey) =>
			this.apiKeyConverter.convert(apiKey),
		);

		this.logger.info(`END: getAllKeys service`);
		return apiKeysDto;
	}

	async updateKey(
		programId: string,
		apiKeyId: string,
		body: UpdateApiKeyDto,
	) {
		this.logger.info(`START: updateKey service`);

		const keyExists = await this.keyExistsInProgram(programId, apiKeyId);

		if (!keyExists) {
			this.logger.error(`Error. Failed to find API key ${apiKeyId} in Program ${programId}`);
			throw new BadRequestException(`Error. Failed to find API key ${apiKeyId} in Program ${programId}`);
		}

		await this.apiKeyRepository.update(
			{ programId, apiKeyId },
			{ status: body.status, updatedAt: () => `NOW()` },
		);

		this.logger.info(`END: updateKey service`);
	}

	async deleteKey(programId: string, apiKeyId: string) {
		this.logger.info(`START: deleteKey service`);

		const keyExists = await this.keyExistsInProgram(programId, apiKeyId);

		if (!keyExists) {
			this.logger.error(`Error. Failed to find API key ${apiKeyId} in Program ${programId}`);
			throw new BadRequestException(`Error. Failed to find API key ${apiKeyId} in Program ${programId}`);
		}

		await this.apiKeyRepository.delete({ programId, apiKeyId });

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

	async keyExistsInProgram(programId: string, apiKeyId: string) {
		const keyResult = await this.apiKeyRepository.findOne({
			where: { programId, apiKeyId },
		});

		if (!keyResult) return false;
		else return true;
	}
}
