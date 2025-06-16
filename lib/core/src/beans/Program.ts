import { IsString, IsEnum, IsUUID, IsDate, IsUrl, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';
import { Visibility, ReferralKeyType, DateFormat } from '../enums';

export class Program {
	@Expose({ name: 'program_id' })
	@IsUUID()
	programId?: string;

	@Expose()
	@IsString()
	name?: string;

	@Expose()
	@IsString()
	@IsUrl({}, { message: 'website url is invalid' })
	website?: string;
	@Expose()
	@IsOptional()
	@IsEnum(Visibility, { message: `visibility must be one of public or private` })
	visibility?: Visibility;

	@Expose({ name: 'referral_key_type' })
	@IsEnum(ReferralKeyType, { message: `referral key type must be one of ${Object.values(ReferralKeyType).join(', ')}` })
	referralKeyType?: ReferralKeyType;

	@Expose()
	@IsString()
	currency?: string;
	@Expose({ name: 'logo_url' })
	@IsOptional()
	@IsUrl()
	logoUrl?: string;
	@Expose({ name: 'terms_and_conditions' })
	@IsOptional()
	@IsString()
	termsAndConditions?: string;

	@Expose({ name: 'theme_color' })
	@IsString()
	themeColor?: string;

	@Expose({ name: 'date_format' })
	@IsEnum(DateFormat, { message: `date format must be one of ${Object.values(DateFormat).join(', ')}` })
	dateFormat?: DateFormat;

	@Expose({ name: 'time_zone' })
	@IsString()
	timeZone?: string;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt?: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt?: Date;

	getProgramId(): string | undefined {
		return this.programId;
	}

	setProgramId(value: string | undefined): void {
		this.programId = value;
	}

	getName(): string | undefined {
		return this.name;
	}

	setName(value: string | undefined): void {
		this.name = value;
	}

	getWebsite(): string | undefined {
		return this.website;
	}

	setWebsite(value: string | undefined): void {
		this.website = value;
	}

	getVisibility(): Visibility | undefined {
		return this.visibility;
	}

	setVisibility(value: Visibility | undefined): void {
		this.visibility = value;
	}

	getReferralKeyType(): ReferralKeyType | undefined {
		return this.referralKeyType;
	}

	setReferralKeyType(value: ReferralKeyType | undefined): void {
		this.referralKeyType = value;
	}

	getCurrency(): string | undefined {
		return this.currency;
	}

	setCurrency(value: string | undefined): void {
		this.currency = value;
	}

	getLogoUrl(): string | undefined {
		return this.logoUrl;
	}

	setLogoUrl(value: string | undefined): void {
		this.logoUrl = value;
	}

	getTermsAndConditions(): string | undefined {
		return this.termsAndConditions;
	}

	setTermsAndConditions(value: string | undefined): void {
		this.termsAndConditions = value;
	}

	getThemeColor(): string | undefined {
		return this.themeColor;
	}

	setThemeColor(value: string | undefined): void {
		this.themeColor = value;
	}

	getDateFormat(): DateFormat | undefined {
		return this.dateFormat;
	}

	setDateFormat(value: DateFormat | undefined): void {
		this.dateFormat = value;
	}

	getTimeZone(): string | undefined {
		return this.timeZone;
	}

	setTimeZone(value: string | undefined): void {
		this.timeZone = value;
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
