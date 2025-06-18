import { Injectable } from '@nestjs/common';
import { FunctionDto } from '../dtos';
import { Function } from '../entities';
import { FixedCommission, GenerateCommissionEffect, PercentageCommission, SwitchCircleEffect } from '../classes';
import { ConditionConverter } from './condition.converter';
import { commissionTypeEnum, effectEnum } from '../enums';
import { plainToInstance } from 'class-transformer';
import { ConverterException } from '@org-quicko/core';

@Injectable()
export class FunctionConverter {
	constructor(private conditionConverter: ConditionConverter) { }

	convert(func: Function): FunctionDto {
		try {
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
		} catch (error) {
			throw new ConverterException('Error converting Function entity to FunctionDto', error);
		}
	}
}
