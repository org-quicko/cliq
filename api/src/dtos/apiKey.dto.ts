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

	@IsOptional()
	@Expose({ name: 'promoter_id' })
	@IsUUID()
	promoterId?: string | null;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt: Date;
}
