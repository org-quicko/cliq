import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import * as crypto from 'crypto';
import * as bcrypt from "bcrypt";
import { ApiKey } from "../entities";
import { LoggerService } from "./logger.service";
import { statusEnum } from "../enums";
import { ProgramService } from './program.service';
import { UpdateApiKeyDto } from "src/dtos/apiKey.dto";
import { ApiKeyConverter } from '../converters/apiKey.converter';

@Injectable()
export class ApiKeyService {
    constructor(
        @InjectRepository(ApiKey)
        private apiKeyRepository: Repository<ApiKey>,
        
        private programService: ProgramService,

        private apiKeyConverter: ApiKeyConverter,

        private logger: LoggerService,
    ) { }

    async generateKey(programId: string, userId: string) {
        this.logger.info(`START: generateKey service`);

        if (!this.programService.checkIfUserExistsInProgram(programId, userId)) {
            this.logger.error(`User ${userId} does not have permission to perform this action!`);
            throw new ForbiddenException(`Forbidden Resource`);
        }

        const key = crypto.randomBytes(16).toString('hex');
        const secret = crypto.randomBytes(32).toString('hex');

        const newApiKey = new ApiKey();
        newApiKey.key = key;
        newApiKey.secret = secret;
        newApiKey.programId = programId;
        
        const apiKey = await this.apiKeyRepository.save(newApiKey);
        const apiKeyDto = this.apiKeyConverter.convert(apiKey, secret);

        this.logger.info(`END: generateKey service`);
        return apiKeyDto;
    }

    async getAllKeys(programId: string) {
        this.logger.info(`START: getAllKeys service`);

        const apiKeys = await this.apiKeyRepository.find({ where: { programId } });
        const apiKeysDto = apiKeys.map(apiKey => this.apiKeyConverter.convert(apiKey));

        this.logger.info(`END: getAllKeys service`);
        return apiKeysDto;
    }

    async updateKey(programId: string, apiKeyId: string, body: UpdateApiKeyDto) {
        this.logger.info(`START: updateKey service`);

        const keyExists = await this.keyExistsInProgram(programId, apiKeyId);

        if (!keyExists) {
            this.logger.error(`Error. Failed to find API key ${apiKeyId} in Program ${programId}`);
            throw new BadRequestException(`Error. Failed to find API key ${apiKeyId} in Program ${programId}`);
        }

        await this.apiKeyRepository.update({ programId, apiKeyId }, { status: body.status, updatedAt: () => `NOW()` });

        this.logger.info(`END: updateKey service`);
    }

    async deleteKey(programId: string, apiKeyId: string) {
        this.logger.info(`START: deleteKey service`);

        await this.apiKeyRepository.delete({ programId, apiKeyId });

        this.logger.info(`END: deleteKey service`);
    }

    async validateKeyAndSecret(key: string, secret: string): Promise<ApiKey | null> {
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

    async getFirstKey(programId: string) {
        this.logger.info(`START: getFirstKey service`);

        const apiKeyResult = await this.apiKeyRepository.findOne({ where: { programId } });

        if (!apiKeyResult) {
            this.logger.error(`Error. Failed to find API key for Program ${programId}.`);
            throw new NotFoundException(`Error. Failed to find API key for Program ${programId}.`);
        }

        this.logger.info(`END: getFirstKey service`);
        return apiKeyResult;
    }

    async keyExistsInProgram(programId: string, apiKeyId: string) {
        const keyResult = await this.apiKeyRepository.findOne({ where: { programId, apiKeyId } });

        if (!keyResult) return false;
        else return true;
    }
}