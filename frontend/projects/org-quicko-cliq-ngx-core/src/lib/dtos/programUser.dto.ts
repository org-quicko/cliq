import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';
import { statusEnum, userRoleEnum } from '../enums';

export class ProgramUserDto {
	@Expose({ name: 'program_id' })
	@IsUUID()
	programId: string;

	@Expose({ name: 'user_id' })
	@IsUUID()
	userId: string;

	@IsEnum(statusEnum)
	status: statusEnum;

	// defaults to member in database
	@IsOptional()
	@IsEnum(userRoleEnum)
	role: userRoleEnum;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt: Date;
}

export class CreateProgramUserDto {
	@IsEnum(statusEnum)
	status: statusEnum;

	// defaults to viewer in database
	@IsOptional()
	@IsEnum(userRoleEnum)
	role: userRoleEnum;
}

export class UpdateProgramUserDto {

	@IsOptional()
	@IsEnum(statusEnum)
	status?: statusEnum;

	// defaults to viewer in database
	@IsOptional()
	@IsEnum(userRoleEnum)
	role: userRoleEnum;

}
