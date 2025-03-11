import { Injectable } from '@nestjs/common';
import { FunctionDto } from '../dtos';
import { Function } from '../entities';
import { ConditionConverter } from './condition.converter';

@Injectable()
export class FunctionConverter {
	constructor(private conditionConverter: ConditionConverter) {}

	convert(func: Function): FunctionDto {
		const functionDto = new FunctionDto();

		functionDto.functionId = func.functionId;

		functionDto.name = func.name;
		functionDto.circleId = func.circle.circleId;
		functionDto.circleName = func.circle.name;
		functionDto.effectType = func.effectType;
		functionDto.effect = func.effect;
		functionDto.trigger = func.trigger;
		functionDto.conditions = this.conditionConverter.convertMany(
			func.conditions,
		);

		functionDto.createdAt = new Date(func.createdAt);
		functionDto.updatedAt = new Date(func.updatedAt);

		return functionDto;
	}
}
