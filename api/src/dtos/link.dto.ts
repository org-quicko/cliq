import { PartialType } from '@nestjs/mapped-types';
import { Expose } from 'class-transformer';
import { IsDate, IsString, IsUUID } from 'class-validator';

export class LinkDto {
	@Expose({ name: 'link_id' })
	@IsUUID()
	linkId: string;

	@Expose({ name: 'ref_val' })
	@IsString()
	refVal: string;

	@Expose({ name: 'product_path' })
	@IsString()
	productPath: string;

	@IsString()
	source: string;

	@IsString()
	medium: string;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt: Date;
}

export class CreateLinkDto {
	@Expose({ name: 'ref_val' })
	@IsString()
	refVal: string;

	@IsString({ each: true })
	source: string;

	@IsString({ each: true })
	medium: string;
}

export class UpdateLinkDto extends PartialType(CreateLinkDto) {}
