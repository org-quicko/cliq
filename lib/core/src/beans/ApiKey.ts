import { Expose } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Status } from '../enums';

export class ApiKey {
	@Expose({ name: 'api_key_id' })
	@IsUUID()
	apiKeyId: string;

	@IsString()
	key: string;

	@IsOptional()
	@IsString()
	secret: string;

	@IsEnum(Status)
	status: Status;

	@IsOptional()
	@Expose({ name: 'program_id' })
	@IsUUID()
	programId: string;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt: Date;
}

export class UpdateApiKey {
	@IsEnum(Status)
	status: Status;
}
