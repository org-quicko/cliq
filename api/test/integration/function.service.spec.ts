import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import { createCommissionFunction, createProgram } from '../support/factories';
import { FunctionService } from '../../src/services/function.service';
import { Circle, Condition, Function } from '../../src/entities';
import {
	commissionTypeEnum,
	conditionOperatorEnum,
	conditionParameterEnum,
	effectEnum,
	functionStatusEnum,
	triggerEnum,
} from '../../src/enums';
import {
	GenerateCommissionEffect,
	SwitchCircleEffect,
} from '../../src/classes';
import { CreateFunctionDto, UpdateFunctionDto } from '../../src/dtos';

const generateCommissionEffect = (
	overrides: Partial<GenerateCommissionEffect['commission']> = {},
): GenerateCommissionEffect => {
	const effect = new GenerateCommissionEffect();
	effect.commission = {
		commissionType: commissionTypeEnum.FIXED,
		commissionValue: 5,
		...overrides,
	} as GenerateCommissionEffect['commission'];
	return effect;
};

const switchCircleEffect = (targetCircleId: string): SwitchCircleEffect => {
	const effect = new SwitchCircleEffect();
	effect.targetCircleId = targetCircleId;
	return effect;
};

const createFunctionDto = (
	circleId: string,
	overrides: Partial<CreateFunctionDto> = {},
): CreateFunctionDto =>
	({
		name: 'Test function',
		trigger: triggerEnum.SIGNUP,
		effectType: effectEnum.GENERATE_COMMISSION,
		effect: generateCommissionEffect(),
		circleId,
		...overrides,
	}) as CreateFunctionDto;

const NON_EXISTENT_UUID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

describe('FunctionService (integration)', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let service: FunctionService;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
		service = app.get(FunctionService);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	async function createSecondCircle(program: {
		programId: string;
	}): Promise<Circle> {
		const repo = dataSource.getRepository(Circle);
		return repo.save(
			repo.create({
				name: 'Second Circle',
				isDefaultCircle: false,
				program: { programId: program.programId } as never,
			}),
		);
	}

	describe('createFunction', () => {
		it('throws NotFoundException when circle_id does not exist in the program', async () => {
			const { program } = await createProgram(dataSource);

			await expect(
				service.createFunction(
					program.programId,
					createFunctionDto(NON_EXISTENT_UUID),
				),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('throws NotFoundException when a SwitchCircleEffect targets a circle that does not exist in the program', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);

			await expect(
				service.createFunction(
					program.programId,
					createFunctionDto(defaultCircle.circleId, {
						effectType: effectEnum.SWITCH_CIRCLE,
						effect: switchCircleEffect(NON_EXISTENT_UUID),
					}),
				),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('persists nested conditions and returns them on the created function', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);

			const result = await service.createFunction(
				program.programId,
				createFunctionDto(defaultCircle.circleId, {
					conditions: [
						{
							condition: {
								parameter: conditionParameterEnum.REVENUE,
								operator: conditionOperatorEnum.GREATER_THAN,
								value: 100,
							},
						},
					],
				} as Partial<CreateFunctionDto>),
			);

			expect(result.conditions).toHaveLength(1);
			expect(result.conditions![0].condition).toMatchObject({
				parameter: conditionParameterEnum.REVENUE,
				operator: conditionOperatorEnum.GREATER_THAN,
				value: 100,
			});

			const storedConditions = await dataSource
				.getRepository(Condition)
				.find({ where: { func: { functionId: result.functionId } } });
			expect(storedConditions).toHaveLength(1);
			expect(storedConditions[0]).toMatchObject({
				parameter: conditionParameterEnum.REVENUE,
				operator: conditionOperatorEnum.GREATER_THAN,
				value: '100',
			});
		});

		it('succeeds with an empty conditions array when body.conditions is omitted', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);

			const result = await service.createFunction(
				program.programId,
				createFunctionDto(defaultCircle.circleId),
			);

			expect(result.conditions).toEqual([]);
		});
	});

	describe('getFunction', () => {
		it('throws NotFoundException when the function id does not exist', async () => {
			const { program } = await createProgram(dataSource);

			await expect(
				service.getFunction(program.programId, NON_EXISTENT_UUID),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('throws NotFoundException when the function exists but in a different program', async () => {
			const { program: programA, defaultCircle: circleA } =
				await createProgram(dataSource);
			const { program: programB } = await createProgram(dataSource);
			const func = await createCommissionFunction(
				dataSource,
				programA,
				circleA,
				{
					trigger: triggerEnum.SIGNUP,
					commissionType: commissionTypeEnum.FIXED,
					commissionValue: 5,
				},
			);

			await expect(
				service.getFunction(programB.programId, func.functionId),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe('getFunctionEntity', () => {
		it("throws NotFoundException for another program's function id (tenant isolation)", async () => {
			const { program: programA, defaultCircle: circleA } =
				await createProgram(dataSource);
			const { program: programB } = await createProgram(dataSource);
			const func = await createCommissionFunction(
				dataSource,
				programA,
				circleA,
				{
					trigger: triggerEnum.SIGNUP,
					commissionType: commissionTypeEnum.FIXED,
					commissionValue: 5,
				},
			);

			await expect(
				service.getFunctionEntity(programB.programId, func.functionId),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe('getAllFunctions', () => {
		it('throws when the program itself does not exist', async () => {
			await expect(
				service.getAllFunctions(
					NON_EXISTENT_UUID,
					{},
					{ skip: 0, take: 10 },
				),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('resolves targetCircleNameMap into the human-readable target circle name for a SWITCH_CIRCLE function', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const targetCircle = await createSecondCircle(program);

			const functionRepo = dataSource.getRepository(Function);
			await functionRepo.save(
				functionRepo.create({
					name: 'Switch function',
					trigger: triggerEnum.SIGNUP,
					effectType: effectEnum.SWITCH_CIRCLE,
					effect: { targetCircleId: targetCircle.circleId },
					status: functionStatusEnum.ACTIVE,
					circleId: defaultCircle.circleId,
					programId: program.programId,
				} as Partial<Function>),
			);

			const result = await service.getAllFunctions(
				program.programId,
				{},
				{ skip: 0, take: 10 },
			);

			const items = result.getItems();
			expect(items).toHaveLength(1);
			const effect = items![0].effect as SwitchCircleEffect;
			expect(effect.targetCircleId).toBe(targetCircle.circleId);
			expect(effect.targetCircleName).toBe('Second Circle');
		});
	});

	describe('updateFunction', () => {
		it('throws NotFoundException when a SwitchCircleEffect targets a circle that does not exist in the program', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const func = await createCommissionFunction(
				dataSource,
				program,
				defaultCircle,
				{
					trigger: triggerEnum.SIGNUP,
					commissionType: commissionTypeEnum.FIXED,
					commissionValue: 5,
				},
			);

			await expect(
				service.updateFunction(program.programId, func.functionId, {
					effect: switchCircleEffect(NON_EXISTENT_UUID),
				} as UpdateFunctionDto),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('throws NotFoundException when the function id does not exist', async () => {
			const { program } = await createProgram(dataSource);

			await expect(
				service.updateFunction(program.programId, NON_EXISTENT_UUID, {
					name: 'New name',
				} as UpdateFunctionDto),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('a plain field update (name) persists', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const func = await createCommissionFunction(
				dataSource,
				program,
				defaultCircle,
				{
					trigger: triggerEnum.SIGNUP,
					commissionType: commissionTypeEnum.FIXED,
					commissionValue: 5,
				},
			);

			await service.updateFunction(program.programId, func.functionId, {
				name: 'Renamed function',
			} as UpdateFunctionDto);

			const stored = await dataSource
				.getRepository(Function)
				.findOneByOrFail({ functionId: func.functionId });
			expect(stored.name).toBe('Renamed function');
		});

		it('diffs the conditions array: updates an existing one, deletes an omitted one, and creates a new one', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const func = await createCommissionFunction(
				dataSource,
				program,
				defaultCircle,
				{
					trigger: triggerEnum.SIGNUP,
					commissionType: commissionTypeEnum.FIXED,
					commissionValue: 5,
				},
			);

			const conditionRepo = dataSource.getRepository(Condition);
			const keptCondition = await conditionRepo.save(
				conditionRepo.create({
					func: { functionId: func.functionId } as Function,
					parameter: conditionParameterEnum.REVENUE,
					operator: conditionOperatorEnum.GREATER_THAN,
					value: '100',
				}),
			);
			const droppedCondition = await conditionRepo.save(
				conditionRepo.create({
					func: { functionId: func.functionId } as Function,
					parameter: conditionParameterEnum.NUM_OF_SIGNUPS,
					operator: conditionOperatorEnum.EQUALS,
					value: '1',
				}),
			);

			await service.updateFunction(program.programId, func.functionId, {
				conditions: [
					{
						conditionId: keptCondition.conditionId,
						condition: {
							parameter: conditionParameterEnum.REVENUE,
							operator: conditionOperatorEnum.GREATER_THAN,
							value: 500,
						},
					},
					{
						condition: {
							parameter: conditionParameterEnum.ITEM_ID,
							operator: conditionOperatorEnum.EQUALS,
							value: 'item-42',
						},
					},
				],
			} as unknown as UpdateFunctionDto);

			const remaining = await conditionRepo.find({
				where: { func: { functionId: func.functionId } },
			});
			expect(remaining).toHaveLength(2);

			const updated = remaining.find(
				(c) => c.conditionId === keptCondition.conditionId,
			);
			expect(updated?.value).toBe('500');

			const created = remaining.find(
				(c) => c.conditionId !== keptCondition.conditionId,
			);
			expect(created).toMatchObject({
				parameter: conditionParameterEnum.ITEM_ID,
				operator: conditionOperatorEnum.EQUALS,
				value: 'item-42',
			});

			expect(
				remaining.some(
					(c) => c.conditionId === droppedCondition.conditionId,
				),
			).toBe(false);
		});
	});

	describe('deleteFunction', () => {
		it('throws NotFoundException when the function id does not exist in the program', async () => {
			const { program } = await createProgram(dataSource);

			await expect(
				service.deleteFunction(program.programId, NON_EXISTENT_UUID),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('removes the function row and cascades the delete to its conditions', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const func = await createCommissionFunction(
				dataSource,
				program,
				defaultCircle,
				{
					trigger: triggerEnum.SIGNUP,
					commissionType: commissionTypeEnum.FIXED,
					commissionValue: 5,
				},
			);
			const conditionRepo = dataSource.getRepository(Condition);
			await conditionRepo.save(
				conditionRepo.create({
					func: { functionId: func.functionId } as Function,
					parameter: conditionParameterEnum.REVENUE,
					operator: conditionOperatorEnum.GREATER_THAN,
					value: '100',
				}),
			);

			await service.deleteFunction(program.programId, func.functionId);

			const storedFunction = await dataSource
				.getRepository(Function)
				.findOneBy({ functionId: func.functionId });
			expect(storedFunction).toBeNull();

			const storedConditions = await conditionRepo.find({
				where: { func: { functionId: func.functionId } },
			});
			expect(storedConditions).toHaveLength(0);
		});
	});
});
