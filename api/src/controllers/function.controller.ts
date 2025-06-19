import { Controller, Get, Post, Delete, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { FunctionService } from '../services/function.service';
import { CreateFunctionDto, UpdateFunctionDto } from '../dtos';
import { effectEnum, triggerEnum } from '../enums';
import { LoggerService } from '../services/logger.service';
import { Permissions } from '../decorators/permissions.decorator';
import { Function } from '../entities';

@ApiTags('Function')
@Controller('/programs/:program_id/functions')
export class FunctionController {
	constructor(
		private readonly functionService: FunctionService,
		private logger: LoggerService,
	) { }

	/**
	 * Create function
	 */
	@ApiResponse({ status: 201, description: 'Created' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@Permissions('create', Function)
	@Post()
	async createFunction(
		@Param('program_id') programId: string,
		@Body() body: CreateFunctionDto,
	) {
		this.logger.info('START: createFunction controller');

		const result = await this.functionService.createFunction(
			programId,
			body,
		);

		this.logger.info('END: createFunction controller');
		return { message: 'Successfully created function.', result };
	}

	/**
	 * Get all functions
	 */
	@ApiResponse({ status: undefined, description: '' })
	@Permissions('read_all', Function)
	@Get()
	async getAllFunctions(
		@Param('program_id') programId: string,
		@Query('circle_name') name: string,
		@Query('trigger') trigger: triggerEnum,
		@Query('effect_type') effectType: effectEnum,
		@Query('skip') skip: number = 0,
		@Query('take') take: number = 10,
	) {
		this.logger.info('START: getAllFunctions controller');

		const result = await this.functionService.getAllFunctions(
			programId,
			{
				name,
				trigger,
				circle: {
					name
				},
				effectType,
			},
			{
				skip,
				take,
			}
		);

		this.logger.info('END: getAllFunctions controller');
		return { message: 'Successfully fetched all functions.', result };
	}

	/**
	 * Get function
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@Permissions('read', Function)
	@Get(':function_id')
	async getFunction(
		@Param('program_id') programId: string,
		@Param('function_id') functionId: string,
	) {
		this.logger.info('START: getFunction controller');

		const result = await this.functionService.getFunction(
			programId,
			functionId,
		);

		this.logger.info('END: getFunction controller');
		return { message: 'Successfully fetched function.', result };
	}

	/**
	 * Update function
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@Permissions('update', Function)
	@Patch(':function_id')
	async updateFunction(
		@Param('program_id') programId: string,
		@Param('function_id') functionId: string,
		@Body() body: UpdateFunctionDto,
	) {
		this.logger.info('START: updateFunction controller');

		await this.functionService.updateFunction(programId, functionId, body);

		this.logger.info('END: updateFunction controller');
		return { message: 'Successfully updated function.' };
	}

	/**
	 * Delete function
	 */
	@ApiResponse({ status: 200, description: 'OK' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@Permissions('delete', Function)
	@Delete(':function_id')
	async deleteFunction(
		@Param('program_id') programId: string,
		@Param('function_id') functionId: string,
	) {
		this.logger.info('START: deleteFunction controller');

		await this.functionService.deleteFunction(programId, functionId);

		this.logger.info('END: deleteFunction controller');
		return { message: 'Successfully deleted function.' };
	}
}
