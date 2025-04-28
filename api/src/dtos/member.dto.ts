import { Expose } from 'class-transformer';
import {
	IsString,
	IsEmail,
	IsDate,
	IsUUID,
	IsOptional,
	IsEnum,
} from 'class-validator';
import { OmitType, PartialType, PickType,  } from '@nestjs/mapped-types';
import { memberRoleEnum, userRoleEnum, statusEnum } from 'src/enums';

export class MemberDto {
	@Expose({ name: 'member_id' })
	@IsUUID()
	memberId: string;

	@IsEmail()
	email: string;

	@Expose({ name: 'first_name' })
	@IsString()
	firstName: string;

	@Expose({ name: 'last_name' })
	@IsString()
	lastName: string;

	@IsOptional()
	@IsEnum(memberRoleEnum)
	role?: memberRoleEnum;

	@IsOptional()
	@IsEnum(statusEnum)
	status?: statusEnum;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt: Date;
}

export class CreateMemberDto {
	@IsEmail()
	email: string;

	@IsOptional()
	@IsString()
	password: string;

	@Expose({ name: 'first_name' })
	@IsString()
	firstName: string;
	
	@Expose({ name: 'last_name' })
	@IsString()
	lastName: string;

	@IsOptional()
	@IsEnum(memberRoleEnum)
	role?: memberRoleEnum;

}

export class UpdateMemberDto {

	@IsOptional()
	@IsEmail()
	email?: string;

	@Expose({ name: 'first_name' })
	@IsOptional()
	@IsString()
	firstName?: string;
	
	@Expose({ name: 'last_name' })
	@IsOptional()
	@IsString()
	lastName?: string;
	
	@Expose({ name: 'new_password' })
	@IsOptional()
	@IsString()
	newPassword?: string;
	
	@Expose({ name: 'current_password' })
	@IsOptional()
	@IsString()
	currentPassword?: string;

}

export class SignUpMemberDto extends OmitType(CreateMemberDto, ['role']) { }

export class MemberExistsInProgramDto extends PickType(SignUpMemberDto, ['email']) { }