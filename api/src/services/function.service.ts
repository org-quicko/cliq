import {
	ForbiddenException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { CreateFunctionDto, UpdateFunctionDto } from 'src/dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere } from 'typeorm';
import { QueryOptionsInterface } from '../interfaces/queryOptions.interface';
import {
	Condition,
	Function,
} from '../entities';
import { SwitchCircleEffect } from "../classes";
import { ProgramService } from './program.service';
import { FunctionConverter } from '../converters/function.converter';
import { LoggerService } from './logger.service';
import { CircleService } from './circle.service';
import { defaultQueryOptions } from 'src/constants';

@Injectable()
export class FunctionService {
	constructor(
		@InjectRepository(Function)
		private readonly functionRepository: Repository<Function>,

		private programService: ProgramService,
		private circleService: CircleService,

		private functionConverter: FunctionConverter,

		private datasource: DataSource,

		private logger: LoggerService,
	) { }

	/**
	 * Create function
	 */
	async createFunction(programId: string, body: CreateFunctionDto) {
		return this.datasource.transaction(async (manager) => {
			this.logger.info('START: createFunction service');

			const programResult = await this.programService.getProgramEntity(programId);

			if (!(await this.circleService.circleExists(programId, body.circleId))) {
				this.logger.error(`Circle ${body.circleId} does not exist in program ${programId}.`);
				throw new NotFoundException(`Circle ${body.circleId} does not exist in program ${programId}.`);
			}
			const circleResult = await this.circleService.getCircleEntity(body.circleId);

			if (
				body.effect instanceof SwitchCircleEffect &&
				!(await this.circleService.circleExists(programId, body.effect.targetCircleId))
			) {
				this.logger.warn(`Target Circle ${body.effect.targetCircleId} does not exist in program ${programId}.`);
				throw new NotFoundException(`Target Circle ${body.effect.targetCircleId} does not exist in program ${programId}.`);
			}

			const functionRepository = manager.getRepository(Function);
			const conditionRepository = manager.getRepository(Condition);

			const conditions = body.conditions
				? await Promise.all(
					body.conditions?.map(async (conditionDto) => {
						const newCondition = conditionRepository.create({
							parameter: conditionDto.condition.parameter,
							operator: conditionDto.condition.operator,
							value: String(conditionDto.condition.value), // Store as string
						});

						return conditionRepository.save(newCondition); // Ensure it's saved
					}),
				)
				: [];

			const newFunction = functionRepository.create({
				...body,
				program: programResult,
				circle: circleResult,
				conditions,
			});


			const savedFunction = await functionRepository.save(newFunction);
			const functionDto = this.functionConverter.convert(savedFunction);

			this.logger.info('END: createFunction service');
			return functionDto;
		});
	}

	/**
	 * Get all functions
	 */
	async getAllFunctions(
		programId: string,
		whereOptions: FindOptionsWhere<Function> = {},
		queryOptions: QueryOptionsInterface = defaultQueryOptions,
	) {
		this.logger.info('START: getAllFunctions service');

		// will throw error in case the program doesn't exist
		await this.programService.getProgramEntity(programId);

		const functionsResult = await this.functionRepository.find({
			where: {
				program: {
					programId,
				},
				...whereOptions,
			},
			relations: {
				circle: true,
				conditions: {
					func: true,
				},
			},
			...queryOptions,
		});

		if (!functionsResult) {
			this.logger.error(`Error. Failed to fetch functions of program ${programId}.`);
			throw new NotFoundException(`Error. Failed to fetch functions of program ${programId}.`);
		}

		this.logger.info('END: getAllFunctions service');

		return functionsResult.map((func) =>
			this.functionConverter.convert(func),
		);
	}

	/**
	 * Get function
	 */
	async getFunction(programId: string, functionId: string) {
		this.logger.info('START: getFunction service');

		const functionResult = await this.functionRepository.findOne({
			where: {
				program: { programId },
				functionId,
			},
			relations: {
				circle: true,
				conditions: {
					func: true,
				},
			},
		});

		if (!functionResult) {
			this.logger.warn(`Error. Function ${functionId} not found.`);
			throw new NotFoundException(
				`Error. Function ${functionId} not found.`,
			);
		}

		const functionDto = this.functionConverter.convert(functionResult);

		this.logger.info('END: getFunction service');
		return functionDto;
	}

	/**
	 * Get function entity
	 */
	async getFunctionEntity(programId: string, functionId: string) {
		this.logger.info('START: getFunctionEntity service');

		const functionResult = await this.functionRepository.findOne({
			where: {
				program: { programId },
				functionId,
			},
			relations: {
				circle: true,
				conditions: {
					func: true,
				},
			},
		});

		if (!functionResult) {
			this.logger.warn(`Error. Function ${functionId} not found.`);
			throw new NotFoundException(`Error. Function ${functionId} not found.`);
		}

		this.logger.info('END: getFunctionEntity service');
		return functionResult;
	}

	/**
	 * Update function
	 */
	async updateFunction(
		programId: string,
		functionId: string,
		body: UpdateFunctionDto,
	) {
		return this.datasource.transaction(async (manager) => {
			this.logger.info('START: updateFunction service');

			const functionRepository = manager.getRepository(Function);
			const conditionRepository = manager.getRepository(Condition);

			if (
				body.effect instanceof SwitchCircleEffect &&
				!(await this.circleService.circleExists(programId, body.effect.targetCircleId))
			) {
				this.logger.warn(`Target Circle ${body.effect.targetCircleId} does not exist in program ${programId}.`);
				throw new NotFoundException(`Target Circle ${body.effect.targetCircleId} does not exist in program ${programId}.`);
			}

			// Fetch function with current conditions
			const functionResult = await functionRepository.findOne({
				where: {
					programId,
					functionId,
				},
				relations: {
					conditions: true,
				},
			});

			if (!functionResult) {
				this.logger.error(`Error. Function ${functionId} not found.`);
				throw new NotFoundException(`Error. Function ${functionId} not found.`);
			}

			// Extract existing conditions
			const existingConditionIds = functionResult.conditions.map(
				(c) => c.conditionId,
			);

			if (body.conditions) {
				// New conditions array for saving
				const updatedConditions: Condition[] = [];

				for (const conditionDto of body.conditions) {
					if (conditionDto.conditionId) {
						// Existing condition - update
						await conditionRepository.update(
							{ conditionId: conditionDto.conditionId },
							{
								parameter: conditionDto.condition.parameter,
								operator: conditionDto.condition.operator,
								value: String(conditionDto.condition.value),
							},
						);

						updatedConditions.push({
							conditionId: conditionDto.conditionId,
						} as Condition); // Keep track of updated ones
					} else {
						// New condition - create
						const newCondition = conditionRepository.create({
							parameter: conditionDto.condition.parameter,
							operator: conditionDto.condition.operator,
							value: String(conditionDto.condition.value),
							func: functionResult,
						});

						const savedCondition =
							await conditionRepository.save(newCondition);
						updatedConditions.push(savedCondition);
					}
				}

				// Handle deleted conditions (remove those not in updatedConditions)
				const conditionIdsToDelete = existingConditionIds.filter(
					(id) =>
						!updatedConditions.some(
							(cond) => cond.conditionId === id,
						),
				);

				if (conditionIdsToDelete.length > 0) {
					await conditionRepository.delete(conditionIdsToDelete);
				}

				// Remove conditions from body before updating function
				delete body.conditions;
			}

			// Update the function itself
			await functionRepository.update(
				{ functionId },
				{ ...body, updatedAt: () => `NOW()` },
			);

			this.logger.info('END: updateFunction service');
		});
	}

	/**
	 * Delete function
	 */
	async deleteFunction(programId: string, functionId: string) {
		this.logger.info('START: deleteFunction service');

		const functionResult = await this.functionRepository.findOne({
			where: {
				programId,
				functionId,
			}
		});

		if (!functionResult) {
			this.logger.error(`Error. Function ${functionId} does not exist in program ${programId}`);
			throw new NotFoundException(`Error. Function ${functionId} does not exist in program ${programId}`);
		}

		await this.functionRepository.remove(functionResult);

		this.logger.info('END: deleteFunction service');
	}
}
