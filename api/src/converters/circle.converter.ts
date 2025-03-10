import { Injectable } from '@nestjs/common';
import { Circle } from '../entities';
import { CircleDto } from '../dtos';

@Injectable()
export class CircleConverter {
	convert(circle: Circle): CircleDto {
		return {
			circleId: circle.circleId,
			isDefaultCircle: circle.isDefaultCircle,
			name: circle.name,
			createdAt: circle.createdAt,
			updatedAt: circle.updatedAt,
		};
	}
}
