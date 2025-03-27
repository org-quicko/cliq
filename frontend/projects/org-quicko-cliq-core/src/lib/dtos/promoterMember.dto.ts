import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';
import { statusEnum, roleEnum } from '../enums';

export class PromoterMemberDto {
	@Expose({ name: 'promoter_id' })
	@IsUUID()
	promoterId: string;

	@Expose({ name: 'member_id' })
	@IsUUID()
	memberId: string;

	@IsEnum(statusEnum)
	status: statusEnum;

	@IsEnum(roleEnum)
	role: roleEnum;
}

export class CreatePromoterMemberDto {
	@IsEnum(statusEnum)
	status: statusEnum;

	@IsEnum(roleEnum)
	role: roleEnum;
}

export class UpdatePromoterMemberDto {

	@IsOptional()
	@IsEnum(statusEnum)
	status?: statusEnum;

	@IsOptional()
	@IsEnum(roleEnum)
	role?: roleEnum;

}
