import {
	IsArray,
	IsBoolean,
	IsDate,
	IsOptional,
	IsString,
	IsUUID,
} from 'class-validator';
import { Expose } from 'class-transformer';

export class Circle {
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

export class CreateCircle {
	@IsString()
	name: string;

	@IsOptional()
	@IsBoolean()
	isDefaultCircle?: boolean;
}

export class UpdateCircle implements Partial<CreateCircle> {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsBoolean()
	isDefaultCircle?: boolean;
}

export class AddPromoterToCircle {
	@IsArray()
	promoters: string[];
}
