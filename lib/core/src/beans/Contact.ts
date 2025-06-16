import { Expose, Transform } from 'class-transformer';
import { IsDate, IsEmail, IsEnum, IsString, IsUUID, Length, Matches, IsOptional } from 'class-validator';
import { ContactStatus } from '../enums';

export class Contact {
	@Expose({ name: 'contact_id' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsUUID()
	contactId?: string;

	@Expose({ name: 'program_id' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsUUID()
	programId?: string;
	@Expose()
	@IsOptional()
	@IsEmail()
	email?: string;
	@Expose({ name: 'external_id' })
	@IsOptional()
	@IsString()
	externalId?: string;

	@Expose({ name: 'first_name' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsString()
	firstName?: string; 
	
	@Expose({ name: 'last_name' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsOptional()
	@IsString()
	lastName?: string;

	@Expose()
	@IsOptional()
	@IsString()
	@Length(8, 13, { message: 'phone number must be between 8 and 13 digits long.' })
	@Matches(/^\d+$/, { message: 'phone number must contain only digits.' })
	phone?: string;

	@Expose()
	@IsEnum(ContactStatus)
	status?: ContactStatus;

	@Expose({ name: 'created_at' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsDate()
	createdAt?: Date;

	@Expose({ name: 'updated_at' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsDate()
	updatedAt?: Date;

	getContactId(): string | undefined {
		return this.contactId;
	}

	setContactId(value: string | undefined): void {
		this.contactId = value;
	}

	getProgramId(): string | undefined {
		return this.programId;
	}

	setProgramId(value: string | undefined): void {
		this.programId = value;
	}

	getEmail(): string | undefined {
		return this.email;
	}

	setEmail(value: string | undefined): void {
		this.email = value;
	}

	getExternalId(): string | undefined {
		return this.externalId;
	}

	setExternalId(value: string | undefined): void {
		this.externalId = value;
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

	getStatus(): ContactStatus | undefined {
		return this.status;
	}

	setStatus(value: ContactStatus | undefined): void {
		this.status = value;
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
