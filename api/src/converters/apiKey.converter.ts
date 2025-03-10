import { Injectable } from '@nestjs/common';
import { ApiKeyDto } from 'src/dtos/apiKey.dto';
import { ApiKey } from 'src/entities';

@Injectable()
export class ApiKeyConverter {
	convert(apiKey: ApiKey, secret?: string): ApiKeyDto {
		const apiKeyDto = new ApiKeyDto();

		apiKeyDto.apiKeyId = apiKey.apiKeyId;
		apiKeyDto.key = apiKey.key;
		// give the non-hashed secret to the user
		apiKeyDto.secret = secret;
		apiKeyDto.status = apiKey.status;

		apiKeyDto.createdAt = apiKey.createdAt;
		apiKeyDto.updatedAt = apiKey.updatedAt;

		return apiKeyDto;
	}
}
