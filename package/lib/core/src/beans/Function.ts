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
import {
	Effect,
	GenerateCommissionEffect,
	SwitchCircleEffect,
} from './Effect';
import { Condition } from './Condition';
import { EffectType, Trigger, FunctionStatus } from '../enums';

export class Function {
	@Expose({ name: 'function_id' })
	@IsUUID()
	functionId: string;

	@IsString()
	name: string;

	@IsEnum(Trigger)
	trigger: Trigger;

	@Expose({ name: 'effect_type' })
	@IsEnum(EffectType)
	effectType: EffectType;

	@IsOptional()
	@IsEnum(FunctionStatus)
	status?: FunctionStatus;

	@IsDefined()
	effect: Effect;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Condition)
	conditions?: Condition[];

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

export class CreateFunction {
	@IsString()
	name: string;

	@IsEnum(Trigger)
	trigger: Trigger;

	@Expose({ name: 'effect_type' })
	@IsEnum(FunctionStatus)
	effectType: FunctionStatus;

	@IsOptional()
	@IsEnum(FunctionStatus)
	status?: FunctionStatus;

	@IsDefined()
	@ValidateNested()
	@Type((object) => object?.object?.effect_type === EffectType.GENERATE_COMMISSION ? GenerateCommissionEffect : SwitchCircleEffect)
	effect: Effect;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Condition)
	conditions?: Condition[];

	// defaults to the DEFAULT_CIRCLE
	@IsOptional()
	@Expose({ name: 'circle_id' })
	@IsUUID()
	circleId: string;
}

export class UpdateFunction implements Partial<CreateFunction> {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsEnum(Trigger)
	trigger?: Trigger;

	@IsOptional()
	@IsEnum(FunctionStatus)
	status?: FunctionStatus;

	@IsOptional()
	@ValidateNested()
	@Type((object) => object?.object?.effect_type === EffectType.GENERATE_COMMISSION ? GenerateCommissionEffect : SwitchCircleEffect)
	effect?: Effect;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Condition)
	conditions?: Condition[];

	// defaults to the DEFAULT_CIRCLE
	@IsOptional()
	@Expose({ name: 'circle_id' })
	@IsUUID()
	circleId?: string;
}
