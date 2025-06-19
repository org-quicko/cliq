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
import { ConditionOperator, ConditionParameter } from '../enums';
import 'reflect-metadata'

export class BaseCondition {
	@Expose({ name: 'parameter' })
	@IsDefined()
	@IsEnum(ConditionParameter)
	parameter: ConditionParameter;

	@Expose({ name: 'operator' })
	@IsDefined()
	@IsEnum(ConditionOperator)
	operator: ConditionOperator;

	@Expose({ name: 'value' })
	@IsDefined()
	@IsString()
	value: string | number; // Always stored as string, will be parsed at runtime

	getParameter(): ConditionParameter {
		return this.parameter;
	}

	setParameter(value: ConditionParameter): void {
		this.parameter = value;
	}

	getOperator(): ConditionOperator {
		return this.operator;
	}

	setOperator(value: ConditionOperator): void {
		this.operator = value;
	}

	getValue(): string | number {
		return this.value;
	}

	setValue(value: string | number): void {
		this.value = value;
	}
}

export class NumOfSignupsCondition extends BaseCondition {
	@Expose({ name: 'parameter' })
	@IsEnum([ConditionParameter.NUM_OF_SIGNUPS])
	parameter: ConditionParameter;

	@Expose({ name: 'operator' })
	@IsEnum([
		ConditionOperator.LESS_THAN_OR_EQUAL_TO,
		ConditionOperator.EQUALS,
	])
	operator: ConditionOperator;

	@Expose({ name: 'value' })
	@IsNumber()
	@Min(1)
	value: number;
}

export class NumOfPurchasesCondition extends BaseCondition {
	@Expose({ name: 'parameter' })
	@IsEnum([ConditionParameter.NUM_OF_PURCHASES])
	parameter: ConditionParameter;

	@Expose({ name: 'operator' })
	@IsEnum([
		ConditionOperator.LESS_THAN_OR_EQUAL_TO,
		ConditionOperator.EQUALS,
	])
	operator: ConditionOperator;

	@Expose({ name: 'value' })
	@IsNumber()
	@Min(1)
	value: number;
}

export class ItemIdCondition extends BaseCondition {
	@Expose({ name: 'parameter' })
	@IsEnum([ConditionParameter.ITEM_ID])
	parameter: ConditionParameter;

	@Expose({ name: 'operator' })
	@IsEnum([ConditionOperator.EQUALS, ConditionOperator.CONTAINS])
	operator: ConditionOperator;

	@Expose({ name: 'value' })
	@IsString()
	value: string;
}

export class Condition {
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
					value: NumOfSignupsCondition,
					name: ConditionParameter.NUM_OF_SIGNUPS as string,
				},
				{
					value: NumOfPurchasesCondition,
					name: ConditionParameter.NUM_OF_PURCHASES as string,
				},
				{
					value: ItemIdCondition,
					name: ConditionParameter.ITEM_ID as string,
				},
			],
		},
		keepDiscriminatorProperty: true,
	})
	condition:
		| NumOfSignupsCondition
		| NumOfPurchasesCondition
		| ItemIdCondition;


	getConditionId(): string | undefined {
		return this.conditionId;
	}

	getCondition(): NumOfSignupsCondition | NumOfPurchasesCondition | ItemIdCondition {
		return this.condition;
	}

	setCondition(
		value: NumOfSignupsCondition | NumOfPurchasesCondition | ItemIdCondition,
	): void {
		this.condition = value;
	}
}
