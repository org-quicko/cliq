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
	IsEmail,
} from 'class-validator';
import { UtmParams } from './UtmParams';

export class Purchase {
	@Expose({ name: 'purchase_id' })
	@IsUUID()
	purchaseId: string;

	@Expose({ name: 'link_id' })
	@IsUUID()
	linkId: string;

	@IsNumber()
	@Min(0, { message: 'amount entered must be non negative' })
	amount: number;

	@IsOptional()
	@IsEmail({  }, { message: 'invalid email passed' })
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
	@Length(8, 13, { message: 'phone number must be between 8 and 13 digits long' })
	@Matches(/^\d+$/, { message: 'phone number must contain only digits' })
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

export class CreatePurchase {
	@Expose({ name: 'ref_val' })
	@IsString()
	refVal: string;

	@IsNumber()
	@Min(0, { message: 'amount entered must be non negative' })
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
	@IsEmail({  }, { message: 'invalid email passed' })
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
	@Length(8, 13, { message: 'phone number must be between 8 and 13 digits long' })
	@Matches(/^\d+$/, { message: 'phone number must contain only digits' })
	phone?: string;
}

export class UpdatePurchase implements Partial<CreatePurchase> {
	@IsOptional()
	@Expose({ name: 'ref_val' })
	@IsString()
	refVal?: string;

	@IsOptional()
	@IsNumber()
	@Min(0, { message: 'amount entered must be non negative' })
	amount?: number;

	@IsOptional()
	@Expose({ name: 'first_name' })
	@IsString()
	firstName?: string;

	@IsOptional()
	@Expose({ name: 'last_name' })
	@IsString()
	lastName?: string;

	@IsOptional()
	@IsEmail({  }, { message: 'invalid email passed' })
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
	itemId?: string;
}
