import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Expose } from 'class-transformer';
import { IsString, IsUUID, IsDate, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { userRoleEnum, statusEnum } from 'src/enums';

export class UserDto {
	@Expose({ name: 'user_id' })
	@IsUUID()
	userId: string;

	@IsEmail()
	email: string;

	@Expose({ name: 'first_name' })
	@IsString()
	firstName: string;

	@Expose({ name: 'last_name' })
	@IsString()
	lastName: string;

	@IsOptional()
	@IsEnum(userRoleEnum)
	programRole?: userRoleEnum;

	@IsEnum(userRoleEnum, { message: `role must be one of ${Object.values(userRoleEnum).join(', ')}` })
	role: userRoleEnum;

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

export class CreateUserDto {
	@IsEmail()
	email: string;

	@IsString()
	password: string;

	@Expose({ name: 'first_name' })
	@IsString()
	firstName: string;

	@Expose({ name: 'last_name' })
	@IsString()
	lastName: string;

	@IsOptional()
	@IsEnum(userRoleEnum, { message: `role must be one of ${Object.values(userRoleEnum).join(', ')}` })
	role?: userRoleEnum;
}

export class UpdateUserDto {
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

export class SignUpUserDto extends OmitType(CreateUserDto, ['role']) { }