import { Expose } from 'class-transformer';
import { IsString, IsUUID, IsDate, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { userRoleEnum, statusEnum } from '../enums';
import { prop } from '@rxweb/reactive-form-validators';

export class UserDto {
	@Expose({ name: 'user_id' })
	@IsUUID()
	userId: string;

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
	@IsEnum(userRoleEnum)
	programRole?: userRoleEnum;

	@IsEnum(userRoleEnum)
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

	@IsOptional()
	@IsEnum(userRoleEnum)
	role?: userRoleEnum;
}

export class UpdateUserDto implements Omit<CreateUserDto, 'email' | 'password' | 'role'> {
	@prop()
	@IsOptional()
	@IsEmail()
	email?: string;

	@prop()
	@Expose({ name: 'new_password' })
	@IsOptional()
	@IsString()
	newPassword?: string;

	@prop()
	@Expose({ name: 'current_password' })
	@IsOptional()
	@IsString()
	currentPassword?: string;

	@prop()
	@Expose({ name: 'first_name' })
	@IsString()
	firstName: string;

	@prop()
	@Expose({ name: 'last_name' })
	@IsString()
	lastName: string;

}

export class SignUpUserDto implements Omit<CreateUserDto, 'role'> {
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
