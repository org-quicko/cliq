import { IsDate, IsDefined, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';
import { Status, MemberRole } from '../enums';
import { Promoter } from './Promoter';

export class PromoterMember {
	@Expose({ name: 'promoter_id' })
	@IsUUID()
	promoterId?: string;

	@Expose()
	@IsDefined()
	promoter?: Promoter;

	@Expose({ name: 'member_id' })
	@IsUUID()
	memberId?: string;

	@Expose()
	@IsEnum(Status)
	status?: Status;

	@Expose()
	@IsEnum(MemberRole)
	role?: MemberRole;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt?: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt?: Date;

	getPromoterId(): string | undefined {
		return this.promoterId;
	}

	setPromoterId(value: string | undefined): void {
		this.promoterId = value;
	}

	getPromoter(): Promoter | undefined {
		return this.promoter;
	}

	setPromoter(value: Promoter | undefined): void {
		this.promoter = value;
	}

	getMemberId(): string | undefined {
		return this.memberId;
	}

	setMemberId(value: string | undefined): void {
		this.memberId = value;
	}

	getStatus(): Status | undefined {
		return this.status;
	}

	setStatus(value: Status | undefined): void {
		this.status = value;
	}

	getRole(): MemberRole | undefined {
		return this.role;
	}

	setRole(value: MemberRole | undefined): void {
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

export class CreatePromoterMember {
	@IsEnum(Status)
	status: Status;

	@IsEnum(MemberRole)
	role: MemberRole;
}

export class UpdatePromoterMember implements Partial<CreatePromoterMember> {
	@IsOptional()
	@IsEnum(Status)
	status?: Status;

	@IsOptional()
	@IsEnum(MemberRole)
	role?: MemberRole;
}
