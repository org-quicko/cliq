import { Expose } from 'class-transformer';
import { IsString, IsUUID, IsDate, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { UserRole, Status } from '../enums';

export class User {
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
	@IsEnum(UserRole)
	programRole?: UserRole;

	@IsEnum(UserRole, { message: `role must be one of ${Object.values(UserRole).join(', ')}` })
	role: UserRole;

	@IsOptional()
	@IsEnum(Status)
	status?: Status;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt: Date;
}

export class CreateUser {
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
	@IsEnum(UserRole, { message: `role must be one of ${Object.values(UserRole).join(', ')}` })
	role?: UserRole;
}

export class UpdateUser {
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

export class SignUpUser implements Omit<CreateUser, 'role'> {
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
}