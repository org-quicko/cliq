import { Expose } from 'class-transformer';
import {
	IsString,
	IsEmail,
	IsDate,
	IsUUID,
	IsOptional,
	IsEnum,
} from 'class-validator';
import { MemberRole, Status } from '../enums';

export class Member {
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
	@IsEnum(MemberRole)
	role?: MemberRole;

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

export class CreateMember {
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
	@IsEnum(MemberRole)
	role?: MemberRole;

}

export class UpdateMember {

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

export class SignUpMember implements Omit<CreateMember, 'role'> {
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

	@Expose({ name: 'external_id' })
	@IsOptional()
	@IsString()
	externalId?: string;
}

export class MemberExistsInProgram implements Pick<SignUpMember, 'email'> {
	@IsEmail()
	email: string;
}