import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { PurchaseService } from '../services/purchase.service';
import { CreatePurchaseDto } from '../dtos';
import { LoggerService } from '../services/logger.service';
import { AuthGuard } from 'src/guards/auth/auth.guard';

@ApiTags('Purchase')
@UseGuards(AuthGuard)
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
		@Body() body: CreatePurchaseDto,
	) {
		this.logger.info('START: createPurchase controller');

		const result = await this.purchaseService.createPurchase(
			apiKeyId,
			body,
		);

		this.logger.info('END: createPurchase controller');
		return { message: 'Successfully created purchase.', result };
	}
}
