import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { CreateSignUpDto } from '../dtos';
import { SignUpService } from '../services/signUp.service';
import winston from 'winston';
import { LoggerFactory } from '@org-quicko/core';

@ApiTags('SignUp')
@Controller('/signups')
export class SignUpController {
	private logger: winston.Logger = LoggerFactory.getLogger(SignUpController.name);
	constructor(
		private readonly signUpService: SignUpService,
	) {}

	/**
	 * Create contact
	 */
	@ApiResponse({ status: 201, description: 'Created' })
	@Post()
	async createSignUp(
		@Headers('api_key_id') apiKeyId: string,
		@Headers('program_id') programId: string,
		@Body() body: CreateSignUpDto,
	) {
		this.logger.info('START: createSignUp controller');

		const signUpResult = await this.signUpService.createSignUp(
			apiKeyId,
			programId,
			body,
		);

		this.logger.info('END: createSignUp controller');
		return {
			message: 'Successfully created signup.',
			result: signUpResult,
		};
	}
}
