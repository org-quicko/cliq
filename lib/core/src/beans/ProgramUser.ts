import { IsDate, IsDefined, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';
import { Status, UserRole } from '../enums';
import { Program } from './Program';

export class ProgramUser {
	@Expose({ name: 'program_id' })
	@IsUUID()
	programId: string;

	@IsDefined()
	program: Program;

	@Expose({ name: 'user_id' })
	@IsUUID()
	userId: string;

	@IsEnum(Status)
	status: Status;

	// defaults to member in database
	@IsOptional()
	@IsEnum(UserRole)
	role: UserRole;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt: Date;
}

export class CreateProgramUser {
	@IsEnum(Status)
	status: Status;

	// defaults to viewer in database
	@IsOptional()
	@IsEnum(UserRole)
	role: UserRole;
}

export class UpdateProgramUser implements Partial<CreateProgramUser> {
	@IsOptional()
	@IsEnum(Status)
	status?: Status;

	// defaults to viewer in database
	@IsOptional()
	@IsEnum(UserRole)
	role?: UserRole;
}
