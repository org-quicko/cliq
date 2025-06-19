import { Expose } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { statusEnum } from 'src/enums';

export class ApiKeyDto {
	@Expose({ name: 'api_key_id' })
	@IsUUID()
	apiKeyId: string;

	@IsString()
	key: string;

	@IsOptional()
	@IsString()
	secret?: string;

	@IsEnum(statusEnum)
	status: statusEnum;

	@IsOptional()
	@Expose({ name: 'program_id' })
	@IsUUID()
	programId?: string;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt: Date;
}

export class UpdateApiKeyDto {
	@IsEnum(statusEnum)
	status: statusEnum;
}
