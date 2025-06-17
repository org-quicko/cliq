import { Injectable } from '@nestjs/common';
import { FunctionDto } from '../dtos';
import { Function } from '../entities';
import { FixedCommission,  GenerateCommissionEffect, PercentageCommission, SwitchCircleEffect } from '../classes';
import { ConditionConverter } from './condition.converter';
import { commissionTypeEnum, effectEnum } from 'src/enums';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class FunctionConverter {
	constructor(private conditionConverter: ConditionConverter) { }

	convert(func: Function): FunctionDto {
		const functionDto = new FunctionDto();

		functionDto.functionId = func.functionId;

		functionDto.name = func.name;
		functionDto.circleId = func.circle.circleId;
		functionDto.circleName = func.circle.name;
		functionDto.effectType = func.effectType;

		if (func.effectType === effectEnum.GENERATE_COMMISSION) {
			const effect = Object.assign(new GenerateCommissionEffect(), func.effect);
			
			if (effect.commission.commissionType === commissionTypeEnum.PERCENTAGE) {
				effect.commission = Object.assign(new PercentageCommission(), effect.commission);
			} else {
				effect.commission = Object.assign(new FixedCommission(), effect.commission);
			}
			functionDto.effect = effect;
		} else {
			functionDto.effect = Object.assign(new SwitchCircleEffect(), func.effect);
		}

		functionDto.trigger = func.trigger;
		functionDto.conditions = this.conditionConverter.convertMany(
			func.conditions,
		);

		functionDto.createdAt = new Date(func.createdAt);
		functionDto.updatedAt = new Date(func.updatedAt);

		return functionDto;
	}
}
