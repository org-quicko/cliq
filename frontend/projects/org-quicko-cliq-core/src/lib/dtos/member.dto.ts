import { Expose } from 'class-transformer';
import {
	IsString,
	IsEmail,
	IsDate,
	IsUUID,
	IsOptional,
	IsEnum,
} from 'class-validator';
import { memberRoleEnum, statusEnum } from '../enums';
import { prop, required } from '@rxweb/reactive-form-validators';

export class MemberDto {
	@Expose({ name: 'member_id' })
	@IsUUID()
	memberId: string;

	@prop()
	@required({ message: "E-mail ID is required" })
	@IsEmail()
	email: string;

	@prop()
	@required({ message: "Password is required" })
	@IsString()
	password: string;

	@prop()
	@Expose({ name: 'first_name' })
	@IsString()
	firstName: string;

	@prop()
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
	@prop()
	@IsEmail()
	email: string;

	@prop()
	@IsString()
	password: string;

	@prop()
	@Expose({ name: 'first_name' })
	@IsString()
	firstName: string;

	@prop()
	@Expose({ name: 'last_name' })
	@IsString()
	lastName: string;

	@prop()
	@IsOptional()
	@IsEnum(memberRoleEnum)
	role?: memberRoleEnum;
}

export class UpdateMemberDto implements Omit<CreateMemberDto, 'email' | 'password'> {

	@prop()
	@IsOptional()
	@IsEmail()
	email?: string;

	@prop()
	@Expose({ name: 'current_password' })
	@IsOptional()
	@IsString()
	currentPassword?: string;

	@prop()
	@Expose({ name: 'new_password' })
	@IsOptional()
	@IsString()
	newPassword?: string;

	@prop()
	@Expose({ name: 'first_name' })
	@IsString()
	firstName: string;

	@prop()
	@Expose({ name: 'last_name' })
	@IsString()
	lastName: string;

}

export class SignUpMemberDto implements Omit<CreateMemberDto, 'role'> {
	@prop()
	@IsEmail()
	email: string;

	@prop()
	@IsString()
	password: string;

	@prop()
	@Expose({ name: 'first_name' })
	@IsString()
	firstName: string;

	@prop()
	@Expose({ name: 'last_name' })
	@IsString()
	lastName: string;
}

export class MemberExistsInProgramDto implements Pick<SignUpMemberDto, 'email'> {
	@prop()
	@IsEmail()
	email: string;
}
