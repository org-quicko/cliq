import { PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import { UtmParams } from 'src/classes';

export class SignUpDto {
	@IsUUID()
	contactId: string;

	@Expose({ name: 'link_id' })
	@IsUUID()
	linkId: string;

	@Expose({ name: 'external_id' })
	@IsString()
	externalId?: string;

	@IsOptional()
	@IsString()
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
	@IsString()
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
	phone?: string;
}

export class UpdateSignUpDto extends PartialType(CreateSignUpDto) { }
