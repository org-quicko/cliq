import { IsString, IsEnum, IsOptional, IsUUID, IsDate, IsUrl } from 'class-validator';
import { Expose } from 'class-transformer';
import { visibilityEnum, referralKeyTypeEnum, dateFormatEnum } from '../enums';

export class ProgramDto {
	@Expose({ name: 'program_id' })
	@IsUUID()
	programId: string;

	@IsString()
	name: string;

	@IsString()
	website: string;

	@IsOptional()
	@IsEnum(visibilityEnum)
	visibility: visibilityEnum;

	@IsOptional()
	@Expose({ name: 'logo_url' })
	@IsUrl()
	logoUrl: string;

	@Expose({ name: 'referral_key_type' })
	@IsEnum(referralKeyTypeEnum)
	referralKeyType: referralKeyTypeEnum;

	@Expose({ name: 'terms_and_conditions' })
	@IsString()
	termsAndConditions: string;

	@IsString()
	currency: string;

	@Expose({ name: 'theme_color' })
	@IsString()
	themeColor: string;

	@Expose({ name: 'date_format' })
	@IsOptional()
	@IsEnum(dateFormatEnum)
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
	website: string;

	@IsEnum(visibilityEnum)
	visibility: visibilityEnum;

	@IsOptional()
	@Expose({ name: 'logo_url' })
	@IsUrl()
	logoUrl?: string;

	@Expose({ name: 'terms_and_conditions' })
	@IsString()
	termsAndConditions: string;

	@Expose({ name: 'referral_key_type' })
	@IsEnum(referralKeyTypeEnum)
	referralKeyType: referralKeyTypeEnum;

	@IsOptional()
	@Expose({ name: 'theme_color' })
	@IsString()
	themeColor?: string;

	@Expose({ name: 'date_format' })
	@IsOptional()
	@IsEnum(dateFormatEnum)
	dateFormat: dateFormatEnum;

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
	@IsString()
	website?: string;

	@IsOptional()
	@Expose({ name: 'theme_color' })
	@IsString()
	themeColor?: string;

	@IsOptional()
	@Expose({ name: 'logo_url' })
	@IsUrl()
	logoUrl?: string;

	@IsOptional()
	@Expose({ name: 'terms_and_conditions' })
	@IsString()
	termsAndConditions?: string;

	@Expose({ name: 'date_format' })
	@IsOptional()
	@IsEnum(dateFormatEnum)
	dateFormat?: dateFormatEnum;

	@Expose({ name: 'time_zone' })
	@IsOptional()
	@IsString()
	timeZone?: string;

}
