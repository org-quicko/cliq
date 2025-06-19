import { PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsEmail, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { UtmParams } from 'src/classes';

export class SignUpDto {
	@Expose({ name: 'contact_id' })
	@IsUUID()
	contactId: string;

	@Expose({ name: 'link_id' })
	@IsUUID()
	linkId: string;

	@Expose({ name: 'external_id' })
	@IsString()
	externalId?: string;

	@IsOptional()
	@IsEmail({  }, { message: 'invalid email passed' })
	email?: string;

	@IsOptional()
	@Expose({ name: 'first_name' })
	@IsString()
	firstName?: string;

	@IsOptional()
	@Expose({ name: 'last_name' })
	@IsString()
	lastName?: string;

	@Expose({ name: 'utm_params' })
	@IsOptional()
	utmParams?: UtmParams;

	@IsOptional()
	@IsString()
	@Length(8, 13, { message: 'phone number must be between 8 and 13 digits long' })
	@Matches(/^\d+$/, { message: 'phone number must contain only digits' })
	phone?: string;

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

export class CreateSignUpDto {
	@Expose({ name: 'ref_val' })
	@IsString()
	refVal: string;

	@IsOptional()
	@IsEmail({  }, { message: 'invalid email passed' })
	email?: string;

	@IsOptional()
	@Expose({ name: 'first_name' })
	@IsString()
	firstName?: string;

	@IsOptional()
	@Expose({ name: 'last_name' })
	@IsString()
	lastName?: string;

	@Expose({ name: 'utm_params' })
	@IsOptional()
	utmParams?: UtmParams;

	@IsOptional()
	@Expose({ name: 'external_id' })
	@IsString()
	externalId?: string;

	@IsOptional()
	@IsString()
	@Length(8, 13, { message: 'phone number must be between 8 and 13 digits long' })
	@Matches(/^\d+$/, { message: 'phone number must contain only digits' })
	phone?: string;
}

export class UpdateSignUpDto extends PartialType(CreateSignUpDto) { }
