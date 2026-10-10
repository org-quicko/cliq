import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { instanceToPlain } from 'class-transformer';
import { FunctionConverter } from './function.converter';
import { ConditionConverter } from './condition.converter';
import { Function, Circle } from '../entities';
import {
	commissionTypeEnum,
	effectEnum,
	functionStatusEnum,
	triggerEnum,
} from '../enums';

describe('FunctionConverter', () => {
	it.each([functionStatusEnum.ACTIVE, functionStatusEnum.INACTIVE])(
		'returns %s status in the serialized API response',
		(status) => {
			const converter = new FunctionConverter(new ConditionConverter());
			const func = Object.assign(new Function(), {
				functionId: 'function',
				name: 'Commission',
				status,
				trigger: triggerEnum.PURCHASE,
				effectType: effectEnum.GENERATE_COMMISSION,
				effect: {
					commission: {
						commissionType: commissionTypeEnum.PERCENTAGE,
						commissionValue: 10,
					},
				},
				circle: Object.assign(new Circle(), {
					circleId: 'circle',
					name: 'Circle',
				}),
				conditions: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			const result = converter.convert(func);
			expect(result.status).toBe(status);
			expect(instanceToPlain(result).status).toBe(status);
		},
	);
});
