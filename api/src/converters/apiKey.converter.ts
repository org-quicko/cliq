import { Injectable } from '@nestjs/common';
import { ApiKeyDto } from '../dtos';
import { ApiKey } from '../entities';
import { ConverterException } from '@org-quicko/core';

@Injectable()
export class ApiKeyConverter {
	convert(apiKey: ApiKey, secret?: string): ApiKeyDto {
		try {
			const apiKeyDto = new ApiKeyDto();

			apiKeyDto.apiKeyId = apiKey.apiKeyId;
			apiKeyDto.key = apiKey.key;
			// give the non-hashed secret to the user
			apiKeyDto.secret = secret;
			apiKeyDto.status = apiKey.status;

			apiKeyDto.createdAt = apiKey.createdAt;
			apiKeyDto.updatedAt = apiKey.updatedAt;

			return apiKeyDto;
		} catch (error) {
			throw new ConverterException('Error converting ApiKey entity to ApiKeyDto', error);
		}
	}
}
