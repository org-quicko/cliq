import { Expose } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { LinkStatus } from '../enums';

export class Link {
	@Expose({ name: 'link_id' })
	@IsUUID()
	linkId: string;

	@IsString()
	name: string;

	@Expose({ name: 'ref_val' })
	@IsString()
	refVal: string;

	@IsOptional()
	@IsEnum(LinkStatus)
	status?: LinkStatus;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt: Date;
}

export class CreateLink {

	@IsString()
	name: string;
	
	@Expose({ name: 'ref_val' })
	@IsString()
	refVal: string;

	@IsOptional()
	@IsEnum(LinkStatus)
	status?: LinkStatus;

}

export class UpdateLink implements Partial<CreateLink> {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@Expose({ name: 'ref_val' })
	@IsString()
	refVal?: string;

	@IsOptional()
	@IsEnum(LinkStatus)
	status?: LinkStatus;
}
