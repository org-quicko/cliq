import { Expose } from 'class-transformer';
import {
	IsString,
	IsEmail,
	IsDate,
	IsUUID,
	IsEnum,
	IsOptional,
} from 'class-validator';
import { MemberRole, Status } from '../enums';

export class Member {
	@Expose({ name: 'member_id' })
	@IsUUID()
	memberId?: string;

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
	@IsEnum(MemberRole)
	role?: MemberRole;

	@Expose()
	@IsOptional()
	@IsEnum(Status)
	status?: Status;

	@Expose({ name: 'new_password' })
	@IsString()
	newPassword?: string;

	@Expose({ name: 'current_password' })
	@IsString()
	currentPassword?: string;

	@Expose({ name: 'external_id' })
	@IsString()
	externalId?: string;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt?: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt?: Date;

	getMemberId(): string | undefined {
		return this.memberId;
	}

	setMemberId(value: string | undefined): void {
		this.memberId = value;
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

	getRole(): MemberRole | undefined {
		return this.role;
	}

	setRole(value: MemberRole | undefined): void {
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

	getExternalId(): string | undefined {
		return this.externalId;
	}

	setExternalId(value: string | undefined): void {
		this.externalId = value;
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
