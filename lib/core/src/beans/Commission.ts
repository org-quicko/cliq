import { Expose } from 'class-transformer';
import { IsDate, IsUUID, IsEnum, IsNumber, Min } from 'class-validator';
import { ConversionType } from '../enums';

export class Commission {
	@Expose({ name: 'commission_id' })
	@IsUUID()
	commissionId?: string;

	@Expose({ name: 'contact_id' })
	@IsUUID()
	contactId?: string;

	@Expose({ name: 'conversion_type' })
	@IsEnum(ConversionType)
	conversionType?: ConversionType;

	@Expose()
	@IsNumber({ allowInfinity: false })
	@Min(0, { message: 'amount entered must be non negative.' })
	amount?: number;

	@Expose({ name: 'promoter_id' })
	@IsUUID()
	promoterId?: string;

	@Expose({ name: 'external_id' })
	@IsUUID()
	externalId?: string;

	@Expose({ name: 'link_id' })
	@IsUUID()
	linkId?: string;

	@Expose()
	@IsNumber({ allowInfinity: false })
	@Min(0, { message: 'revenue entered must be non negative.' })
	revenue?: number;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt?: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt?: Date;

	getCommissionId(): string | undefined {
		return this.commissionId;
	}

	setCommissionId(value: string | undefined): void {
		this.commissionId = value;
	}

	getContactId(): string | undefined {
		return this.contactId;
	}

	setContactId(value: string | undefined): void {
		this.contactId = value;
	}

	getConversionType(): ConversionType | undefined {
		return this.conversionType;
	}

	setConversionType(value: ConversionType | undefined): void {
		this.conversionType = value;
	}

	getAmount(): number | undefined {
		return this.amount;
	}

	setAmount(value: number | undefined): void {
		this.amount = value;
	}

	getPromoterId(): string | undefined {
		return this.promoterId;
	}

	setPromoterId(value: string | undefined): void {
		this.promoterId = value;
	}

	getExternalId(): string | undefined {
		return this.externalId;
	}

	setExternalId(value: string | undefined): void {
		this.externalId = value;
	}

	getLinkId(): string | undefined {
		return this.linkId;
	}

	setLinkId(value: string | undefined): void {
		this.linkId = value;
	}

	getRevenue(): number | undefined {
		return this.revenue;
	}

	setRevenue(value: number | undefined): void {
		this.revenue = value;
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
