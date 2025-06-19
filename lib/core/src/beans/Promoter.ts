import { Expose } from 'class-transformer';
import { IsString, IsDate, IsUUID, IsBoolean, IsEnum } from 'class-validator';
import { PromoterStatus } from '../enums';

export class Promoter {
	@Expose({ name: 'promoter_id' })
	@IsUUID()
	promoterId?: string;

	@Expose()
	@IsString()
	name?: string;

	@Expose({ name: 'logo_url' })
	@IsString()
	logoUrl?: string;

	@Expose()
	@IsEnum(PromoterStatus)
	status?: PromoterStatus;

	@Expose({ name: 'accepted_terms_and_conditions' })
	@IsBoolean()
	acceptedTermsAndConditions?: boolean;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt?: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt?: Date;

	getPromoterId(): string | undefined {
		return this.promoterId;
	}

	setPromoterId(value: string | undefined): void {
		this.promoterId = value;
	}

	getName(): string | undefined {
		return this.name;
	}

	setName(value: string | undefined): void {
		this.name = value;
	}

	getLogoUrl(): string | undefined {
		return this.logoUrl;
	}

	setLogoUrl(value: string | undefined): void {
		this.logoUrl = value;
	}

	getStatus(): PromoterStatus | undefined {
		return this.status;
	}

	setStatus(value: PromoterStatus | undefined): void {
		this.status = value;
	}

	getAcceptedTermsAndConditions(): boolean | undefined {
		return this.acceptedTermsAndConditions;
	}

	setAcceptedTermsAndConditions(value: boolean | undefined): void {
		this.acceptedTermsAndConditions = value;
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