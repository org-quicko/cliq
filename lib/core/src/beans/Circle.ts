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
	circleId?: string;

	@Expose()
	@IsString()
	name?: string;

	@Expose({ name: 'is_default_circle' })
	@IsBoolean()
	isDefaultCircle?: boolean;

	@Expose({ name: 'created_at' })
	@IsDate()
	createdAt?: Date;

	@Expose({ name: 'updated_at' })
	@IsDate()
	updatedAt?: Date;

	@Expose()
	@IsArray()
	promoters?: string[];

	getCircleId(): string | undefined {
		return this.circleId;
	}

	setCircleId(value: string | undefined): void {
		this.circleId = value;
	}

	getName(): string | undefined {
		return this.name;
	}

	setName(value: string | undefined): void {
		this.name = value;
	}

	getIsDefaultCircle(): boolean | undefined {
		return this.isDefaultCircle;
	}

	setIsDefaultCircle(value: boolean | undefined): void {
		this.isDefaultCircle = value;
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

	getPromoters(): string[] | undefined {
		return this.promoters;
	}

	setPromoters(value: string[] | undefined): void {
		this.promoters = value;
	}
}

