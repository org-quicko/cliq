import { Expose } from 'class-transformer';
import { IsDate, IsEmail, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { UtmParams } from './UtmParams';

export class SignUp {
	@Expose({ name: 'contact_id' })
	@IsUUID()
	contactId?: string;

	@Expose({ name: 'link_id' })
	@IsUUID()
	linkId?: string;

	@Expose({ name: 'external_id' })
	@IsString()
	externalId?: string;

	@IsOptional()
	@Expose()
	@IsEmail({}, { message: 'invalid email passed' })
	email?: string;

	@IsOptional()
	@Expose({ name: 'first_name' })
	@IsString()
	firstName?: string;

	@IsOptional()
	@Expose({ name: 'last_name' })
	@IsString()
	lastName?: string;

	@IsOptional()
	@Expose({ name: 'utm_params' })
	utmParams?: UtmParams;

	@IsOptional()
	@Expose()
	@IsString()
	@Length(8, 13, { message: 'phone number must be between 8 and 13 digits long' })
	@Matches(/^\d+$/, { message: 'phone number must contain only digits' })
	phone?: string;

	@Expose({ name: 'promoter_id' })
	@IsUUID()
	promoterId?: string;

	@Expose({ name: 'ref_val' })
	@IsString()
	refVal?: string;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt?: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt?: Date;

	getContactId(): string | undefined {
		return this.contactId;
	}

	setContactId(value: string | undefined): void {
		this.contactId = value;
	}

	getLinkId(): string | undefined {
		return this.linkId;
	}

	setLinkId(value: string | undefined): void {
		this.linkId = value;
	}

	getExternalId(): string | undefined {
		return this.externalId;
	}

	setExternalId(value: string | undefined): void {
		this.externalId = value;
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

	getUtmParams(): UtmParams | undefined {
		return this.utmParams;
	}

	setUtmParams(value: UtmParams | undefined): void {
		this.utmParams = value;
	}

	getPhone(): string | undefined {
		return this.phone;
	}

	setPhone(value: string | undefined): void {
		this.phone = value;
	}

	getPromoterId(): string | undefined {
		return this.promoterId;
	}

	setPromoterId(value: string | undefined): void {
		this.promoterId = value;
	}

	getRefVal(): string | undefined {
		return this.refVal;
	}

	setRefVal(value: string | undefined): void {
		this.refVal = value;
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
