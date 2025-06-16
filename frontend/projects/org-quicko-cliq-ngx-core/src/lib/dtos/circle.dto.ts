import {
	IsArray,
	IsBoolean,
	IsDate,
	IsOptional,
	IsString,
	IsUUID,
} from 'class-validator';
import { Expose } from 'class-transformer';
export class CircleDto {
	@Expose({ name: 'circle_id' })
	@IsUUID()
	circleId: string;

	@IsString()
	name: string;

	@IsBoolean()
	isDefaultCircle: boolean;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt: Date;
}

export class CreateCircleDto {
	@IsString()
	name: string;

	@IsOptional()
	@IsBoolean()
	isDefaultCircle?: boolean;
}

export class UpdateCircleDto {
	@IsString()
	@IsOptional()
	name?: string;

	@IsOptional()
	@IsBoolean()
	isDefaultCircle?: boolean;
}

export class AddPromoterToCircleDto {
	@IsArray()
	promoters: string[];
}
