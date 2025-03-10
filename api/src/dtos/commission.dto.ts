import { PartialType } from '@nestjs/mapped-types';
import { Expose } from 'class-transformer';
import { IsDate, IsUUID, IsEnum, IsNumber, Min } from 'class-validator';
import { conversionTypeEnum } from '../enums';

export class CommissionDto {
	@Expose({ name: 'commission_id' })
	@IsUUID()
	commissionId: string;

	@Expose({ name: 'contact_id' })
	@IsUUID()
	contactId: string;

	@Expose({ name: 'conversion_type' })
	@IsEnum(conversionTypeEnum)
	conversionType: conversionTypeEnum;

	@IsNumber({ allowInfinity: false })
	@Min(0, { message: 'amount entered must be non negative.' })
	amount: number;

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

export class CreateCommissionDto {
	@Expose({ name: 'contact_id' })
	@IsUUID()
	contactId: string;

	@Expose({ name: 'conversion_type' })
	@IsEnum(conversionTypeEnum)
	conversionType: conversionTypeEnum;

	@Expose({ name: 'promoter_id' })
	@IsUUID()
	promoterId: string;

	@IsNumber({ allowInfinity: false })
	@Min(0, { message: 'amount entered must be non negative.' })
	amount: number;
}

export class UpdateCommissionDto extends PartialType(CreateCommissionDto) {}
