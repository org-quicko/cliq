import { prop } from '@rxweb/reactive-form-validators';
import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsDate, IsUUID, IsBoolean } from 'class-validator';

export class PromoterDto {
	@Expose({ name: 'promoter_id' })
	@IsUUID()
	promoterId: string;

	@IsString()
	name: string;

	@Expose({ name: 'logo_url' })
	@IsString()
	logoUrl: string;

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

export class UpdatePromoterDto {

	@prop()
	@IsOptional()
	@IsString()
	name?: string;

	@prop()
	@IsOptional()
	@Expose({ name: 'logo_url' })
	@IsString()
	logoUrl?: string;

}
