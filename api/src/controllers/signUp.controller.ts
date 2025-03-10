import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { CreateSignUpDto } from '../dtos';
import { SignUpService } from '../services/signUp.service';
import { LoggerService } from '../services/logger.service';
import { AuthGuard } from 'src/guards/auth/auth.guard';

@ApiTags('SignUp')
@UseGuards(AuthGuard)
@Controller('/signups')
export class SignUpController {
	constructor(
		private readonly signUpService: SignUpService,
		private logger: LoggerService,
	) {}

	/**
	 * Create contact
	 */
	@ApiResponse({ status: 201, description: 'Created' })
	@Post()
	async createSignUp(
		@Headers('api_key_id') apiKeyId: string,
		@Body() body: CreateSignUpDto,
	) {
		this.logger.info('START: createSignUp controller');

		const signUpResult = await this.signUpService.createSignUp(
			apiKeyId,
			body,
		);

		this.logger.info('END: createSignUp controller');
		return {
			message: 'Successfully created signup.',
			result: signUpResult,
		};
	}
}
