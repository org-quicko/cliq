import { IsDate, IsDefined, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';
import { Status, MemberRole } from '../enums';
import { Promoter } from './Promoter';

export class PromoterMember {
	@Expose({ name: 'promoter_id' })
	@IsUUID()
	promoterId: string;

	@IsDefined()
	promoter: Promoter;

	@Expose({ name: 'member_id' })
	@IsUUID()
	memberId: string;

	@IsEnum(Status)
	status: Status;

	@IsEnum(MemberRole)
	role: MemberRole;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt: Date;
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
