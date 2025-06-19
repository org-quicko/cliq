import { Expose } from 'class-transformer';
import {
	IsString,
	IsNumber,
	IsUUID,
	Min,
	IsDate,
	Length,
	Matches,
	IsEmail,
	IsOptional,
} from 'class-validator';
import { UtmParams } from './UtmParams';

export class Purchase {
	@Expose({ name: 'purchase_id' })
	@IsUUID()
	purchaseId?: string;

	@Expose({ name: 'link_id' })
	@IsUUID()
	linkId?: string;

	@Expose()
	@IsNumber()
	@Min(0, { message: 'amount entered must be non negative' })
	amount?: number;

	@Expose()
	@IsOptional()
	@IsEmail({}, { message: 'invalid email passed' })
	email?: string;

	@Expose({ name: 'first_name' })
	@IsOptional()
	@IsString()
	firstName?: string;

	@Expose({ name: 'last_name' })
	@IsOptional()
	@IsString()
	lastName?: string;

	@Expose()
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
	itemId?: string;

	@Expose({ name: 'ref_val' })
	@IsString()
	refVal?: string;

	@Expose({ name: 'utm_params' })
	@IsOptional()
	utmParams?: UtmParams;

	@Expose({ name: 'contact_id' })
	@IsUUID()
	contactId?: string;

	@Expose({ name: 'promoter_id' })
	@IsUUID()
	promoterId?: string;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt?: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt?: Date;

	getPurchaseId(): string | undefined {
		return this.purchaseId;
	}

	setPurchaseId(value: string | undefined): void {
		this.purchaseId = value;
	}

	getLinkId(): string | undefined {
		return this.linkId;
	}

	setLinkId(value: string | undefined): void {
		this.linkId = value;
	}

	getAmount(): number | undefined {
		return this.amount;
	}

	setAmount(value: number | undefined): void {
		this.amount = value;
	}

	getEmail(): string | undefined {
		return this.email;
	}

	setEmail(value: string | undefined): void {
		this.email = value;
	}

	getFirstName(): string | undefined {
		return this.firstName;
	}

	setFirstName(value: string | undefined): void {
		this.firstName = value;
	}

	getLastName(): string | undefined {
		return this.lastName;
	}

	setLastName(value: string | undefined): void {
		this.lastName = value;
	}

	getPhone(): string | undefined {
		return this.phone;
	}

	setPhone(value: string | undefined): void {
		this.phone = value;
	}

	getExternalId(): string | undefined {
		return this.externalId;
	}

	setExternalId(value: string | undefined): void {
		this.externalId = value;
	}

	getItemId(): string | undefined {
		return this.itemId;
	}

	setItemId(value: string | undefined): void {
		this.itemId = value;
	}

	getRefVal(): string | undefined {
		return this.refVal;
	}

	setRefVal(value: string | undefined): void {
		this.refVal = value;
	}

	getUtmParams(): UtmParams | undefined {
		return this.utmParams;
	}

	setUtmParams(value: UtmParams | undefined): void {
		this.utmParams = value;
	}

	getContactId(): string | undefined {
		return this.contactId;
	}

	setContactId(value: string | undefined): void {
		this.contactId = value;
	}

	getPromoterId(): string | undefined {
		return this.promoterId;
	}

	setPromoterId(value: string | undefined): void {
		this.promoterId = value;
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
