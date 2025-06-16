import { Expose } from 'class-transformer';
import { IsString, IsUUID, IsDate, IsEnum, IsEmail, IsOptional } from 'class-validator';
import { UserRole, Status } from '../enums';

export class User {
	@Expose({ name: 'user_id' })
	@IsUUID()
	userId?: string;

	@Expose()
	@IsEmail()
	email?: string;

	@Expose()
	@IsString()
	password?: string;

	@Expose({ name: 'first_name' })
	@IsString()
	firstName?: string;

	@Expose({ name: 'last_name' })
	@IsString()
	lastName?: string;

	@Expose()
	@IsOptional()
	@IsEnum(UserRole)
	programRole?: UserRole;

	@Expose()
	@IsEnum(UserRole, { message: `role must be one of ${Object.values(UserRole).join(', ')}` })
	role?: UserRole;

	@Expose()
	@IsOptional()
	@IsEnum(Status)
	status?: Status;

	@Expose({ name: 'new_password' })
	@IsOptional()
	@IsString()
	newPassword?: string;

	@Expose({ name: 'current_password' })
	@IsOptional()
	@IsString()
	currentPassword?: string;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt?: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt?: Date;

	getUserId(): string | undefined {
		return this.userId;
	}

	setUserId(value: string | undefined): void {
		this.userId = value;
	}

	getEmail(): string | undefined {
		return this.email;
	}

	setEmail(value: string | undefined): void {
		this.email = value;
	}

	getPassword(): string | undefined {
		return this.password;
	}

	setPassword(value: string | undefined): void {
		this.password = value;
	}

	getFirstName(): string | undefined {
		return this.firstName;
	}

	setFirstName(value: string | undefined): void {
		this.firstName = value;
	}

	getLastName(): string | undefined {
		return this.lastName;
	}

	setLastName(value: string | undefined): void {
		this.lastName = value;
	}

	getProgramRole(): UserRole | undefined {
		return this.programRole;
	}

	setProgramRole(value: UserRole | undefined): void {
		this.programRole = value;
	}

	getRole(): UserRole | undefined {
		return this.role;
	}

	setRole(value: UserRole | undefined): void {
		this.role = value;
	}

	getStatus(): Status | undefined {
		return this.status;
	}

	setStatus(value: Status | undefined): void {
		this.status = value;
	}

	getNewPassword(): string | undefined {
		return this.newPassword;
	}

	setNewPassword(value: string | undefined): void {
		this.newPassword = value;
	}

	getCurrentPassword(): string | undefined {
		return this.currentPassword;
	}

	setCurrentPassword(value: string | undefined): void {
		this.currentPassword = value;
	}

	getCreatedAt(): Date | undefined {
		return this.createdAt;
	}

	setCreatedAt(value: Date | undefined): void {
		this.createdAt = value;
	}

	getUpdatedAt(): Date | undefined {
		return this.updatedAt;
	}

	setUpdatedAt(value: Date | undefined): void {
		this.updatedAt = value;
	}
}