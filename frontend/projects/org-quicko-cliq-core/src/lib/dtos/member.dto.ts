import { Expose } from 'class-transformer';
import { IsDate, IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { roleEnum } from '../enums/role.enum';
import { statusEnum } from '../enums/status.enum';

export class MemberDto {
	@Expose({ name: 'member_id' })
	@IsUUID()
	memberId: string;

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
	@IsEnum(roleEnum)
	role?: roleEnum;

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
