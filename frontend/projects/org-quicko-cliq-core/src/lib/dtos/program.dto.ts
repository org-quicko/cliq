import { Expose } from "class-transformer";
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { dateFormatEnum } from "../enums/dateFormat.enum";
import { referralKeyTypeEnum } from "../enums/referralKeyType.enum";
import { visibilityEnum } from "../enums/visibility.enum";

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

	@Expose({ name: 'referral_key_type' })
	@IsEnum(referralKeyTypeEnum)
	referralKeyType: referralKeyTypeEnum;

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
