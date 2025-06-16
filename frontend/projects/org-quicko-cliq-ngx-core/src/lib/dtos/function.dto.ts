import {
	IsString,
	IsArray,
	ValidateNested,
	IsEnum,
	IsOptional,
	IsUUID,
	IsDate,
	IsDefined,
} from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { triggerEnum, effectEnum, statusEnum, functionStatusEnum } from '../enums';
import {
	Effect,
	GenerateCommissionEffect,
	SwitchCircleEffect,
} from '../classes';
import { ConditionDto } from './condition.dto';

export class FunctionDto {
	@Expose({ name: 'function_id' })
	@IsUUID()
	functionId: string;

	@IsString()
	name: string;

	@IsEnum(triggerEnum)
	trigger: triggerEnum;

	@Expose({ name: 'effect_type' })
	@IsEnum(effectEnum)
	effectType: effectEnum;

	@IsOptional()
	@IsEnum(functionStatusEnum)
	status?: functionStatusEnum;

	@IsDefined()
	effect: Effect;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ConditionDto)
	conditions?: ConditionDto[];

	@Expose({ name: 'circle_id' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsUUID()
	circleId: string;

	@Expose({ name: 'circle_name' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsString()
	circleName: string;

	@Expose({ name: 'created_at' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsDate()
	createdAt: Date;

	@Expose({ name: 'updated_at' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsDate()
	updatedAt: Date;
}

export class CreateFunctionDto {
	@IsString()
	name: string;

	@IsEnum(triggerEnum)
	trigger: triggerEnum;

	@Expose({ name: 'effect_type' })
	@IsEnum(effectEnum)
	effectType: effectEnum;

	@IsOptional()
	@IsEnum(functionStatusEnum)
	status?: functionStatusEnum;

	@IsDefined()
	@ValidateNested()
	@Type((object) => {
		return object?.object?.['effect_type'] === effectEnum.GENERATE_COMMISSION
			? GenerateCommissionEffect
			: SwitchCircleEffect;
	})
	effect: Effect;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ConditionDto)
	conditions?: ConditionDto[];

	// defaults to the DEFAULT_CIRCLE
	@IsOptional()
	@Expose({ name: 'circle_id' })
	@IsUUID()
	circleId: string;
}

export class UpdateFunctionDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsEnum(triggerEnum)
	trigger?: triggerEnum;

	@IsOptional()
	@Expose({ name: 'effect_type' })
	@IsEnum(effectEnum)
	effectType?: effectEnum;

	@IsOptional()
	@IsEnum(functionStatusEnum)
	status?: functionStatusEnum;

	@IsOptional()
	@IsDefined()
	@ValidateNested()
	@Type((object) => {
		return object?.object?.['effect_type'] === effectEnum.GENERATE_COMMISSION
		? GenerateCommissionEffect
		: SwitchCircleEffect;
	})
	effect?: Effect;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ConditionDto)
	conditions?: ConditionDto[];

	// defaults to the DEFAULT_CIRCLE
	@IsOptional()
	@Expose({ name: 'circle_id' })
	@IsUUID()
	circleId?: string;
}
