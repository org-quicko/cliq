import { PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
	IsString,
	IsNumber,
	IsOptional,
	IsUUID,
	Min,
	IsDate,
	Length,
	Matches,
} from 'class-validator';
import { UtmParams } from 'src/classes';

export class PurchaseDto {
	@Expose({ name: 'purchase_id' })
	@IsUUID()
	purchaseId: string;

	@Expose({ name: 'link_id' })
	@IsUUID()
	linkId: string;

	@IsNumber()
	// @IsPositive({ message: 'amount entered must be greater than 0' })
	@Min(0, { message: 'amount entered must be non negative.' })
	amount: number;

	@IsOptional()
	@IsString()
	email?: string;

	@IsOptional()
	@Expose({ name: 'first_name' })
	@IsString()
	firstName: string;

	@IsOptional()
	@Expose({ name: 'last_name' })
	@IsString()
	lastName: string;

	@IsOptional()
	@IsString()
	@Length(8, 13, { message: 'phone number must be between 8 and 13 digits long.' })
	@Matches(/^\d+$/, { message: 'phone number must contain only digits.' })
	phone?: string;

	@Expose({ name: 'external_id' })
	@IsString()
	externalId?: string;

	@Expose({ name: 'item_id' })
	@IsString()
	itemId: string;

	@Expose({ name: 'utm_params' })
	@IsOptional()
	utmParams?: UtmParams;

	@Expose({ name: 'contact_id' })
	@IsUUID()
	contactId: string;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt: Date;
}

export class CreatePurchaseDto {
	@Expose({ name: 'ref_val' })
	@IsString()
	refVal: string;

	@IsNumber()
	// @IsPositive({ message: 'amount entered must be greater than 0' })
	@Min(0, { message: 'amount entered must be non negative.' })
	amount: number;

	@IsOptional()
	@Expose({ name: 'first_name' })
	@IsString()
	firstName?: string;

	@IsOptional()
	@Expose({ name: 'last_name' })
	@IsString()
	lastName?: string;

	@IsOptional()
	@IsString()
	email?: string;

	@IsOptional()
	@Expose({ name: 'external_id' })
	@IsString()
	externalId?: string;

	@Expose({ name: 'utm_params' })
	@IsOptional()
	utmParams?: UtmParams;

	@Expose({ name: 'item_id' })
	@IsString()
	itemId: string;

	@IsOptional()
	@IsString()
	@Length(8, 13, { message: 'phone number must be between 8 and 13 digits long.' })
	@Matches(/^\d+$/, { message: 'phone number must contain only digits.' })
	phone?: string;
}

export class UpdatePurchaseDto extends PartialType(CreatePurchaseDto) {}
