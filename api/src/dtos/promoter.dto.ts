import { PartialType, PickType } from '@nestjs/mapped-types';
import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsDate, IsUUID, IsBoolean, IsEnum } from 'class-validator';
import { promoterStatusEnum } from 'src/enums';

export class PromoterDto {
	@Expose({ name: 'promoter_id' })
	@IsUUID()
	promoterId: string;

	@IsString()
	name: string;

	@Expose({ name: 'logo_url' })
	@IsString()
	logoUrl: string;
	
	@IsEnum(promoterStatusEnum)
	status: promoterStatusEnum;

	@Expose({ name: 'accepted_terms_and_conditions' })
	@IsBoolean()
	acceptedTermsAndConditions: boolean;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt: Date;
}

export class CreatePromoterDto {
	@IsString()
	name: string;

	@IsOptional()
	@Expose({ name: 'logo_url' })
	@IsString()
	logoUrl?: string;
}

export class UpdatePromoterDto extends PartialType(CreatePromoterDto) {}

export class RegisterForProgramDto extends PickType(PromoterDto, ['acceptedTermsAndConditions']) { }