import { Injectable } from '@nestjs/common';
import {
	ConditionDto,
	ItemIdConditionDto,
	NumOfPurchasesConditionDto,
	NumOfSignupsConditionDto,
	RevenueConditionDto,
} from '../dtos';
import { Condition } from '../entities';
import { conditionParameterEnum } from 'src/enums';

@Injectable()
export class ConditionConverter {
	private conditionFactories = {
		[conditionParameterEnum.REVENUE]: (condition: Condition) => {
			const dto = new RevenueConditionDto();
			dto.parameter = conditionParameterEnum.REVENUE;
			dto.operator = condition.operator;
			dto.value = Number(condition.value);
			return dto;
		},
		[conditionParameterEnum.NUM_OF_SIGNUPS]: (condition: Condition) => {
			const dto = new NumOfSignupsConditionDto();
			dto.parameter = conditionParameterEnum.NUM_OF_SIGNUPS;
			dto.operator = condition.operator;
			dto.value = Number(condition.value);
			return dto;
		},
		[conditionParameterEnum.NUM_OF_PURCHASES]: (condition: Condition) => {
			const dto = new NumOfPurchasesConditionDto();
			dto.parameter = conditionParameterEnum.NUM_OF_PURCHASES;
			dto.operator = condition.operator;
			dto.value = Number(condition.value);
			return dto;
		},
		[conditionParameterEnum.ITEM_ID]: (condition: Condition) => {
			const dto = new ItemIdConditionDto();
			dto.parameter = conditionParameterEnum.ITEM_ID;
			dto.operator = condition.operator;
			dto.value = condition.value;
			return dto;
		},
	};

	convert(condition: Condition): ConditionDto {
		const conditionDto = new ConditionDto();
		conditionDto.conditionId = condition.conditionId;

		const factory = this.conditionFactories[condition.parameter];
		if (!factory) {
			throw new Error(
				`Unsupported condition parameter: ${condition.parameter}`,
			);
		}

		conditionDto.condition = factory(condition);
		return conditionDto;
	}

	convertMany(conditions: Condition[]): ConditionDto[] {
		return conditions.map((condition) => this.convert(condition));
	}
}
