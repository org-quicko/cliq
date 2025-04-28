import { PartialType } from '@nestjs/mapped-types';
import { Expose } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { linkStatusEnum } from 'src/enums';

export class LinkDto {
	@Expose({ name: 'link_id' })
	@IsUUID()
	linkId: string;

	@IsString()
	name: string;

	@Expose({ name: 'ref_val' })
	@IsString()
	refVal: string;

	@IsOptional()
	@IsEnum(linkStatusEnum)
	status?: linkStatusEnum;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt: Date;
}

export class CreateLinkDto {

	@IsString()
	name: string;
	
	@Expose({ name: 'ref_val' })
	@IsString()
	refVal: string;

	@IsOptional()
	@IsEnum(linkStatusEnum)
	status?: linkStatusEnum;

}

export class UpdateLinkDto extends PartialType(CreateLinkDto) { }
