import { IsString, IsEnum, IsOptional, IsUUID, IsDate, IsUrl } from 'class-validator';
import { Expose } from 'class-transformer';
import { Visibility, ReferralKeyType, DateFormat } from '../enums';

export class Program {
	@Expose({ name: 'program_id' })
	@IsUUID()
	programId: string;

	@IsString()
	name: string;

	@IsString()
	@IsUrl({}, { message: 'website url is invalid' })
	website: string;

	@IsOptional()
	@IsEnum(Visibility, { message: `visibility must be one of public or private` })
	visibility: Visibility;

	@Expose({ name: 'referral_key_type' })
	@IsEnum(ReferralKeyType, { message: `referral key type must be one of ${Object.values(ReferralKeyType).join(', ')}` })
	referralKeyType: ReferralKeyType;

	@IsString()
	currency: string;

	@Expose({ name: 'logo_url' })
	@IsUrl()
	logoUrl: string;

	@Expose({ name: 'terms_and_conditions' })
	@IsString()
	termsAndConditions: string;

	@Expose({ name: 'theme_color' })
	@IsString()
	themeColor: string;

	@Expose({ name: 'date_format' })
	@IsOptional()
	@IsEnum(DateFormat, { message: `date format must be one of ${Object.values(DateFormat).join(', ')}` })
	dateFormat: DateFormat;

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

export class CreateProgram {
	@IsString()
	name: string;

	@IsString()
	currency: string;

	@IsOptional()
	@Expose({ name: 'logo_url' })
	@IsUrl()
	logoUrl?: string;

	@IsString()
	@IsUrl({}, { message: 'website url is invalid' })
	website: string;

	@IsEnum(Visibility, { message: `visibility must be one of public or private` })
	visibility: Visibility;

	@Expose({ name: 'referral_key_type' })
	@IsEnum(ReferralKeyType, { message: `referral key type must be one of ${Object.values(ReferralKeyType).join(', ')}` })
	referralKeyType: ReferralKeyType;

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
	@IsEnum(DateFormat, { message: `date format must be one of ${Object.values(DateFormat).join(', ')}` })
	dateFormat?: DateFormat;

	@Expose({ name: 'time_zone' })
	@IsString()
	timeZone: string;
}

export class UpdateProgram {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	currency?: string;

	@IsOptional()
	@Expose({ name: 'logo_url' })
	@IsUrl()
	logoUrl?: string;

	@IsOptional()
	@IsUrl({}, { message: 'website url is invalid' })
	website?: string;

	@IsOptional()
	@IsEnum(Visibility, { message: `visibility must be one of public or private` })
	visibility?: Visibility;

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
	@IsEnum(DateFormat, { message: `date format must be one of ${Object.values(DateFormat).join(', ')}` })
	dateFormat?: DateFormat;
	
	@Expose({ name: 'time_zone' })
	@IsOptional()
	@IsString()
	timeZone?: string;
}
