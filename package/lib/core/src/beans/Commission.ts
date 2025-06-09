import { Expose } from 'class-transformer';
import { IsDate, IsUUID, IsEnum, IsNumber, Min, IsOptional } from 'class-validator';
import { ConversionType } from '../enums';

export class Commission {
	@Expose({ name: 'commission_id' })
	@IsUUID()
	commissionId: string;

	@Expose({ name: 'contact_id' })
	@IsUUID()
	contactId: string;

	@Expose({ name: 'conversion_type' })
	@IsEnum(ConversionType)
	conversionType: ConversionType;

	@IsNumber({ allowInfinity: false })
	@Min(0, { message: 'amount entered must be non negative.' })
	amount: number;

	@Expose({ name: 'promoter_id' })
	@IsUUID()
	promoterId: string;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt: Date;
}

export class CreateCommission {
	@Expose({ name: 'contact_id' })
	@IsUUID()
	contactId: string;

	@Expose({ name: 'conversion_type' })
	@IsEnum(ConversionType)
	conversionType: ConversionType;

	@Expose({ name: 'external_id' })
	@IsUUID()
	externalId: string;

	@Expose({ name: 'promoter_id' })
	@IsUUID()
	promoterId: string;

	@Expose({ name: 'link_id' })
	@IsUUID()
	linkId: string;

	@IsNumber({ allowInfinity: false })
	@Min(0, { message: 'amount entered must be non negative.' })
	amount: number;

	@IsNumber({ allowInfinity: false })
	@Min(0, { message: 'revenue entered must be non negative.' })
	revenue: number;
}

export class UpdateCommission implements Partial<CreateCommission> {
	@IsOptional()
	@Expose({ name: 'contact_id' })
	@IsUUID()
	contactId?: string;

	@IsOptional()
	@Expose({ name: 'conversion_type' })
	@IsEnum(ConversionType)
	conversionType?: ConversionType;

	@IsOptional()
	@Expose({ name: 'external_id' })
	@IsUUID()
	externalId?: string;

	@IsOptional()
	@Expose({ name: 'promoter_id' })
	@IsUUID()
	promoterId?: string;

	@IsOptional()
	@Expose({ name: 'link_id' })
	@IsUUID()
	linkId?: string;

	@IsOptional()
	@IsNumber({ allowInfinity: false })
	@Min(0, { message: 'amount entered must be non negative.' })
	amount?: number;

	@IsOptional()
	@IsNumber({ allowInfinity: false })
	@Min(0, { message: 'revenue entered must be non negative.' })
	revenue?: number;
}
