import { IsDate, IsDefined, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';
import { Status, UserRole } from '../enums';
import { Program } from './Program';

export class ProgramUser {
	@Expose({ name: 'program_id' })
	@IsUUID()
	programId?: string;

	@Expose()
	@IsDefined()
	program?: Program;

	@Expose({ name: 'user_id' })
	@IsUUID()
	userId?: string;

	@Expose()
	@IsEnum(Status)
	status?: Status;

	@IsOptional()
	@Expose()
	@IsEnum(UserRole)
	role?: UserRole;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt?: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt?: Date;

	getProgramId(): string | undefined {
		return this.programId;
	}

	setProgramId(value: string | undefined): void {
		this.programId = value;
	}

	getProgram(): Program | undefined {
		return this.program;
	}

	setProgram(value: Program | undefined): void {
		this.program = value;
	}

	getUserId(): string | undefined {
		return this.userId;
	}

	setUserId(value: string | undefined): void {
		this.userId = value;
	}

	getStatus(): Status | undefined {
		return this.status;
	}

	setStatus(value: Status | undefined): void {
		this.status = value;
	}

	getRole(): UserRole | undefined {
		return this.role;
	}

	setRole(value: UserRole | undefined): void {
		this.role = value;
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
