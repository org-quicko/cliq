import {
	IsDefined,
	IsEnum,
	IsString,
	IsNumber,
	ValidateNested,
	IsOptional,
	IsUUID,
	Min,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { conditionOperatorEnum, conditionParameterEnum } from 'src/enums';

export const numericalOperators = Object.values(conditionOperatorEnum).filter(operator => operator !== conditionOperatorEnum.CONTAINS);

export class BaseConditionDto {
	@Expose({ name: 'parameter' })
	@IsDefined()
	@IsEnum(conditionParameterEnum)
	parameter: conditionParameterEnum;

	@Expose({ name: 'operator' })
	@IsDefined()
	@IsEnum(conditionOperatorEnum)
	operator: conditionOperatorEnum;

	@Expose({ name: 'value' })
	@IsDefined()
	@IsString()
	value: string | number; // Always stored as string, will be parsed at runtime
}

export class RevenueConditionDto extends BaseConditionDto {
	@Expose({ name: 'parameter' })
	@IsEnum([conditionParameterEnum.REVENUE])
	declare parameter: conditionParameterEnum;

	@Expose({ name: 'operator' })
	@IsEnum(numericalOperators)
	declare operator: conditionOperatorEnum;

	@Expose({ name: 'value' })
	@IsNumber()
	@Min(1)
	declare value: number;
}

export class NumOfSignupsConditionDto extends BaseConditionDto {
	@Expose({ name: 'parameter' })
	@IsEnum([conditionParameterEnum.NUM_OF_SIGNUPS])
	declare parameter: conditionParameterEnum;

	@Expose({ name: 'operator' })
	@IsEnum(numericalOperators)
	declare operator: conditionOperatorEnum;

	@Expose({ name: 'value' })
	@IsNumber()
	@Min(1)
	declare value: number;
}

export class NumOfPurchasesConditionDto extends BaseConditionDto {
	@Expose({ name: 'parameter' })
	@IsEnum([conditionParameterEnum.NUM_OF_PURCHASES])
	declare parameter: conditionParameterEnum;

	@Expose({ name: 'operator' })
	@IsEnum(numericalOperators)
	declare operator: conditionOperatorEnum;

	@Expose({ name: 'value' })
	@IsNumber()
	@Min(1)
	declare value: number;
}

export class ItemIdConditionDto extends BaseConditionDto {
	@Expose({ name: 'parameter' })
	@IsEnum([conditionParameterEnum.ITEM_ID])
	declare parameter: conditionParameterEnum;

	@Expose({ name: 'operator' })
	@IsEnum([conditionOperatorEnum.EQUALS, conditionOperatorEnum.CONTAINS])
	declare operator: conditionOperatorEnum;

	@Expose({ name: 'value' })
	@IsString()
	declare value: string;
}

export class ConditionDto {
	@Expose({ name: 'condition_id' })
	@IsOptional()
	@IsUUID()
	conditionId?: string;

	@Expose({ name: 'condition' })
	@ValidateNested()
	@Type(() => Object, {
		discriminator: {
			property: 'parameter',
			subTypes: [
				{
					value: RevenueConditionDto,
					name: conditionParameterEnum.REVENUE as string,
				},
				{
					value: NumOfSignupsConditionDto,
					name: conditionParameterEnum.NUM_OF_SIGNUPS as string,
				},
				{
					value: NumOfPurchasesConditionDto,
					name: conditionParameterEnum.NUM_OF_PURCHASES as string,
				},
				{
					value: ItemIdConditionDto,
					name: conditionParameterEnum.ITEM_ID as string,
				},
			],
		},
		keepDiscriminatorProperty: true,
	})
	condition:
		RevenueConditionDto
		| NumOfSignupsConditionDto
		| NumOfPurchasesConditionDto
		| ItemIdConditionDto;
}
