import { IsString, IsEnum, IsOptional, IsUUID, IsDate, IsUrl } from 'class-validator';
import { Expose } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { visibilityEnum, referralKeyTypeEnum, dateFormatEnum } from '../enums';

export class ProgramDto {
	@Expose({ name: 'program_id' })
	@IsUUID()
	programId: string;

	@IsString()
	name: string;

	@IsString()
	@IsUrl({}, { message: 'website url is invalid' })
	website: string;

	@IsOptional()
	@IsEnum(visibilityEnum, { message: `visibility must be one of public or private` })
	visibility: visibilityEnum;

	@Expose({ name: 'referral_key_type' })
	@IsEnum(referralKeyTypeEnum, { message: `referral key type must be one of ${Object.values(referralKeyTypeEnum).join(', ')}` })
	referralKeyType: referralKeyTypeEnum;

	@IsString()
	currency: string;

	@Expose({ name: 'terms_and_conditions' })
	@IsString()
	termsAndConditions: string;

	@Expose({ name: 'theme_color' })
	@IsString()
	themeColor: string;

	@Expose({ name: 'date_format' })
	@IsOptional()
	@IsEnum(dateFormatEnum, { message: `date format must be one of ${Object.values(dateFormatEnum).join(', ')}` })
	dateFormat: dateFormatEnum;

	@Expose({ name: 'time_zone' })
	@IsString()
	timeZone: string;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt: Date;
}

export class CreateProgramDto {
	@IsString()
	name: string;

	@IsString()
	currency: string;

	@IsString()
	@IsUrl({}, { message: 'website url is invalid' })
	website: string;

	@IsEnum(visibilityEnum, { message: `visibility must be one of public or private` })
	visibility: visibilityEnum;

	@Expose({ name: 'referral_key_type' })
	@IsEnum(referralKeyTypeEnum, { message: `referral key type must be one of ${Object.values(referralKeyTypeEnum).join(', ')}` })
	referralKeyType: referralKeyTypeEnum;

	@IsOptional()
	@Expose({ name: 'theme_color' })
	@IsString()
	themeColor?: string;
	
	
	@IsOptional()
	@Expose({ name: 'terms_and_conditions' })
	@IsString()
	termsAndConditions?: string;

	@Expose({ name: 'date_format' })
	@IsOptional()
	@IsEnum(dateFormatEnum, { message: `date format must be one of ${Object.values(dateFormatEnum).join(', ')}` })
	dateFormat?: dateFormatEnum;

	@Expose({ name: 'time_zone' })
	@IsString()
	timeZone: string;
}

export class UpdateProgramDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	currency?: string;

	@IsOptional()
	@IsUrl({}, { message: 'website url is invalid' })
	website?: string;

	@IsOptional()
	@IsEnum(visibilityEnum, { message: `visibility must be one of public or private` })
	visibility?: visibilityEnum;

	@IsOptional()
	@Expose({ name: 'theme_color' })
	@IsString()
	themeColor?: string;

	@IsOptional()
	@Expose({ name: 'terms_and_conditions' })
	@IsString()
	termsAndConditions?: string;

	@Expose({ name: 'date_format' })
	@IsOptional()
	@IsEnum(dateFormatEnum, { message: `date format must be one of ${Object.values(dateFormatEnum).join(', ')}` })
	dateFormat?: dateFormatEnum;
	
	@Expose({ name: 'time_zone' })
	@IsOptional()
	@IsString()
	timeZone?: string;
}
