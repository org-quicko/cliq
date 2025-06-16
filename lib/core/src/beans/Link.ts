import { Expose } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { LinkStatus } from '../enums';

export class Link {
	@Expose({ name: 'link_id' })
	@IsUUID()
	linkId?: string;

	@Expose()
	@IsString()
	name?: string;

	@Expose({ name: 'ref_val' })
	@IsString()
	refVal?: string;
	@Expose()
	@IsOptional()
	@IsEnum(LinkStatus)
	status?: LinkStatus;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt?: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt?: Date;

	getLinkId(): string | undefined {
		return this.linkId;
	}

	setLinkId(value: string | undefined): void {
		this.linkId = value;
	}

	getName(): string | undefined {
		return this.name;
	}

	setName(value: string | undefined): void {
		this.name = value;
	}

	getRefVal(): string | undefined {
		return this.refVal;
	}

	setRefVal(value: string | undefined): void {
		this.refVal = value;
	}

	getStatus(): LinkStatus | undefined {
		return this.status;
	}

	setStatus(value: LinkStatus | undefined): void {
		this.status = value;
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
