import { Expose } from 'class-transformer';
import { IsDate, IsEnum, IsString, IsUUID, IsOptional } from 'class-validator';
import { Status } from '../enums';

export class ApiKey {
	@Expose({ name: 'api_key_id' })
	@IsUUID()
	apiKeyId?: string;

	@Expose()
	@IsString()
	key?: string;
	
	@Expose()
	@IsOptional()
	@IsString()
	secret?: string;

	@Expose()
	@IsEnum(Status)
	status?: Status;

	@Expose({ name: 'program_id' })
	@IsOptional()
	@IsUUID()
	programId?: string;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt?: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt?: Date;

	getApiKeyId(): string | undefined {
		return this.apiKeyId;
	}

	setApiKeyId(value: string | undefined): void {
		this.apiKeyId = value;
	}

	getKey(): string | undefined {
		return this.key;
	}

	setKey(value: string | undefined): void {
		this.key = value;
	}

	getSecret(): string | undefined {
		return this.secret;
	}

	setSecret(value: string | undefined): void {
		this.secret = value;
	}

	getStatus(): Status | undefined {
		return this.status;
	}

	setStatus(value: Status | undefined): void {
		this.status = value;
	}

	getProgramId(): string | undefined {
		return this.programId;
	}

	setProgramId(value: string | undefined): void {
		this.programId = value;
	}

	getCreatedAt(): Date | undefined {
		return this.createdAt;
	}

	setCreatedAt(value: Date | undefined): void {
		this.createdAt = value;
	}

	getUpdatedAt(): Date | undefined {
		return this.updatedAt;
	}

	setUpdatedAt(value: Date | undefined): void {
		this.updatedAt = value;
	}
}