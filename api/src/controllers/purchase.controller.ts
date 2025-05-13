import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { PurchaseService } from '../services/purchase.service';
import { CreatePurchaseDto } from '../dtos';
import { LoggerService } from '../services/logger.service';
import { AuthGuard } from 'src/guards/auth.guard';

@ApiTags('Purchase')
@Controller('/purchases')
export class PurchaseController {
	constructor(
		private readonly purchaseService: PurchaseService,
		private logger: LoggerService,
	) {}

	/**
	 * Create Purchase
	 */
	@ApiResponse({ status: 201, description: 'Created' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@Post()
	async createPurchase(
		@Headers('api_key_id') apiKeyId: string,
		@Headers('program_id') programId: string,
		@Body() body: CreatePurchaseDto,
	) {
		this.logger.info('START: createPurchase controller');

		const result = await this.purchaseService.createPurchase(
			apiKeyId,
			programId,
			body,
		);

		this.logger.info('END: createPurchase controller');
		return { message: 'Successfully created purchase.', result };
	}
}
