import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsDate, IsUUID, IsBoolean, IsEnum } from 'class-validator';
import { PromoterStatus } from '../enums';

export class Promoter {
	@Expose({ name: 'promoter_id' })
	@IsUUID()
	promoterId: string;

	@IsString()
	name: string;

	@Expose({ name: 'logo_url' })
	@IsString()
	logoUrl: string;
	
	@IsEnum(PromoterStatus)
	status: PromoterStatus;

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

export class CreatePromoter {
	@IsString()
	name: string;

	@IsOptional()
	@Expose({ name: 'logo_url' })
	@IsString()
	logoUrl?: string;
}

export class UpdatePromoter implements Partial<CreatePromoter> {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@Expose({ name: 'logo_url' })
	@IsString()
	logoUrl?: string;
}

export class RegisterForProgram implements Pick<Promoter, 'acceptedTermsAndConditions'> {
	@Expose({ name: 'accepted_terms_and_conditions' })
	@IsBoolean()
	acceptedTermsAndConditions: boolean;
}