import {
	IsString,
	IsArray,
	ValidateNested,
	IsEnum,
	IsUUID,
	IsDate,
	IsDefined,
	IsOptional,
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
	functionId?: string;

	@Expose()
	@IsString()
	name?: string;

	@Expose()
	@IsEnum(Trigger)
	trigger?: Trigger;

	@Expose({ name: 'effect_type' })
	@IsEnum(EffectType)
	effectType?: EffectType;
	@Expose()
	@IsOptional()
	@IsEnum(FunctionStatus)
	status?: FunctionStatus;

	@Expose()
	@IsDefined()
	@ValidateNested()
	@Type((object) => object?.object?.effect_type === EffectType.GENERATE_COMMISSION ? GenerateCommissionEffect : SwitchCircleEffect)
	effect?: Effect;
	
	@Expose()
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Condition)
	conditions?: Condition[];

	@Expose({ name: 'circle_id' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsUUID()
	circleId?: string;

	@Expose({ name: 'circle_name' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsString()
	circleName?: string;

	@Expose({ name: 'created_at' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsDate()
	createdAt?: Date;

	@Expose({ name: 'updated_at' })
	@Transform(({ value }) => value, { toClassOnly: true })
	@IsDate()
	updatedAt?: Date;

	getFunctionId(): string | undefined {
		return this.functionId;
	}

	setFunctionId(value: string | undefined): void {
		this.functionId = value;
	}

	getName(): string | undefined {
		return this.name;
	}

	setName(value: string | undefined): void {
		this.name = value;
	}

	getTrigger(): Trigger | undefined {
		return this.trigger;
	}

	setTrigger(value: Trigger | undefined): void {
		this.trigger = value;
	}

	getEffectType(): EffectType | undefined {
		return this.effectType;
	}

	setEffectType(value: EffectType | undefined): void {
		this.effectType = value;
	}

	getStatus(): FunctionStatus | undefined {
		return this.status;
	}

	setStatus(value: FunctionStatus | undefined): void {
		this.status = value;
	}

	getEffect(): Effect | undefined {
		return this.effect;
	}

	setEffect(value: Effect | undefined): void {
		this.effect = value;
	}

	getConditions(): Condition[] | undefined {
		return this.conditions;
	}

	setConditions(value: Condition[] | undefined): void {
		this.conditions = value;
	}

	getCircleId(): string | undefined {
		return this.circleId;
	}

	setCircleId(value: string | undefined): void {
		this.circleId = value;
	}

	getCircleName(): string | undefined {
		return this.circleName;
	}

	setCircleName(value: string | undefined): void {
		this.circleName = value;
	}

	getCreatedAt(): Date | undefined {
		return this.createdAt;
	}

	setCreatedAt(value: Date | undefined): void {
		this.createdAt = value;
	}

	getUpdatedAt(): Date | undefined {
		return this.updatedAt;
	}

	setUpdatedAt(value: Date | undefined): void {
		this.updatedAt = value;
	}
}
