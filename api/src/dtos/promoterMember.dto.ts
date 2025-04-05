import { IsDate, IsDefined, IsEnum, IsUUID } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Expose } from 'class-transformer';
import { statusEnum, memberRoleEnum } from '../enums';
import { PromoterDto } from './promoter.dto';

export class PromoterMemberDto {
	@Expose({ name: 'promoter_id' })
	@IsUUID()
	promoterId: string;

	@IsDefined()
	promoter: PromoterDto;

	@Expose({ name: 'member_id' })
	@IsUUID()
	memberId: string;

	@IsEnum(statusEnum)
	status: statusEnum;

	@IsEnum(memberRoleEnum)
	role: memberRoleEnum;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt: Date;
}

export class CreatePromoterMemberDto {
	@IsEnum(statusEnum)
	status: statusEnum;

	@IsEnum(memberRoleEnum)
	role: memberRoleEnum;
}

export class UpdatePromoterMemberDto extends PartialType(
	CreatePromoterMemberDto,
) { }
