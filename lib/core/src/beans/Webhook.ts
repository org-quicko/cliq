import { Expose } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsDate, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class Webhook {
	@Expose({ name: 'webhook_id' })
	@IsUUID()
	webhookId?: string;

	@Expose({ name: 'program_id' })
	@IsUUID()
	programId?: string;

	@Expose()
	@IsString()
	@IsNotEmpty()
	secret?: string;

	@Expose()
	@IsString()
	@IsNotEmpty()
	url?: string;

	@Expose()
	@IsArray()
	@ArrayNotEmpty()
	events?: string[];

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt?: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt?: Date;

	getWebhookId(): string | undefined {
		return this.webhookId;
	}

	setWebhookId(value: string | undefined): void {
		this.webhookId = value;
	}

	getProgramId(): string | undefined {
		return this.programId;
	}

	setProgramId(value: string | undefined): void {
		this.programId = value;
	}

	getSecret(): string | undefined {
		return this.secret;
	}

	setSecret(value: string | undefined): void {
		this.secret = value;
	}

	getUrl(): string | undefined {
		return this.url;
	}

	setUrl(value: string | undefined): void {
		this.url = value;
	}

	getEvents(): string[] | undefined {
		return this.events;
	}

	setEvents(value: string[] | undefined): void {
		this.events = value;
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
