import { Injectable } from '@nestjs/common';
import { Circle } from '../entities';
import { CircleDto } from '../dtos';

@Injectable()
export class CircleConverter {
	convert(circle: Circle): CircleDto {
		const circleDto = new CircleDto();

		circleDto.circleId = circle.circleId;
		
		circleDto.isDefaultCircle = circle.isDefaultCircle;
		circleDto.name = circle.name;
		
		circleDto.createdAt = circle.createdAt;
		circleDto.updatedAt = circle.updatedAt;

		return circleDto;
	}
}
