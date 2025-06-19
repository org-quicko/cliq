import { Injectable } from '@nestjs/common';
import { Circle } from '../entities';
import { CircleDto } from '../dtos';
import { ConverterException } from '@org-quicko/core';

@Injectable()
export class CircleConverter {
	convert(circle: Circle): CircleDto {
		try {
			const circleDto = new CircleDto();

			circleDto.circleId = circle.circleId;
			circleDto.isDefaultCircle = circle.isDefaultCircle;
			circleDto.name = circle.name;
			circleDto.createdAt = circle.createdAt;
			circleDto.updatedAt = circle.updatedAt;

			return circleDto;
		} catch (error) {
			throw new ConverterException('Error converting Circle entity to CircleDto', error);
		}
	}
}
