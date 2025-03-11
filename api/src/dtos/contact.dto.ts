import { PartialType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { contactStatusEnum } from '../enums';

export class ContactDto {
	@Expose({ name: 'contact_id' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsUUID()
	contactId: string;

	@Expose({ name: 'program_id' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsUUID()
	programId: string;

	@IsOptional()
	@IsString()
	email?: string;

	@IsOptional()
	@Expose({ name: 'first_name' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsString()
	firstName: string;

	@IsOptional()
	@Expose({ name: 'last_name' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsString()
	lastName: string;

	@IsOptional()
	@IsString()
	phone?: string;

	@IsEnum(contactStatusEnum)
	status: contactStatusEnum;

	@Expose({ name: 'created_at' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsDate()
	updatedAt: Date;
}

export class CreateContactDto {
	@Expose({ name: 'program_id' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsUUID()
	programId: string;

	@IsOptional()
	@IsString()
	email?: string;

	@Expose({ name: 'external_id' })
	@IsOptional()
	@IsString()
	externalId?: string;

	@IsOptional()
	@Expose({ name: 'first_name' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsString()
	firstName?: string;

	@IsOptional()
	@Expose({ name: 'last_name' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsString()
	lastName?: string;

	@IsOptional()
	@IsString()
	phone?: string;

	@IsOptional()
	@IsEnum(contactStatusEnum)
	status?: contactStatusEnum;
}

export class UpdateContactDto extends PartialType(CreateContactDto) {}
