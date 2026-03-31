import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    Body,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Permissions } from "../decorators/permissions.decorator";
import { PromoterWebhook } from "../entities";
import { PromoterWebhookService } from "../services/promoterWebhook.service";
import { CreatePromoterWebhookDto, UpdatePromoterWebhookDto } from "../dtos";
import { LoggerFactory } from "@org-quicko/core";
import winston from "winston";

@ApiTags('Promoter Webhooks')
@Controller('programs/:program_id/promoters/:promoter_id/webhooks')
export class PromoterWebhookController {
    private logger: winston.Logger = LoggerFactory.getLogger(PromoterWebhookController.name);

    constructor(
        private readonly promoterWebhookService: PromoterWebhookService,
    ) {}

    @ApiResponse({ status: 201, description: 'Created' })
    @Permissions('create', PromoterWebhook)
    @Post()
    async createPromoterWebhook(
        @Param('program_id') programId: string,
        @Param('promoter_id') promoterId: string,
        @Body() body: CreatePromoterWebhookDto
    ) {
        this.logger.info(`START: createPromoterWebhook controller`);

        const result = await this.promoterWebhookService.createPromoterWebhook(
            programId,
            promoterId,
            body
        );

        this.logger.info(`END: createPromoterWebhook controller`);
        return {
            message: `Successfully created webhook for Promoter ${promoterId} in Program ${programId}`,
            result
        };
    }

    @ApiResponse({ status: 200, description: 'OK' })
    @Permissions('read_all', PromoterWebhook)
    @Get()
    async getAllPromoterWebhooks(
        @Param('program_id') programId: string,
        @Param('promoter_id') promoterId: string
    ) {
        this.logger.info(`START: getAllPromoterWebhooks controller`);

        const result = await this.promoterWebhookService.getAllPromoterWebhooks(
            programId,
            promoterId
        );

        this.logger.info(`END: getAllPromoterWebhooks controller`);
        return {
            message: `Successfully fetched all webhooks for Promoter ${promoterId} in Program ${programId}`,
            result
        };
    }

    @ApiResponse({ status: 200, description: 'OK' })
    @Permissions('read', PromoterWebhook)
    @Get(':webhook_id')
    async getPromoterWebhook(
        @Param('program_id') programId: string,
        @Param('promoter_id') promoterId: string,
        @Param('webhook_id') webhookId: string
    ) {
        this.logger.info(`START: getPromoterWebhook controller`);

        const result = await this.promoterWebhookService.getPromoterWebhook(
            programId,
            promoterId,
            webhookId
        );

        this.logger.info(`END: getPromoterWebhook controller`);
        return {
            message: `Successfully fetched webhook ${webhookId} for Promoter ${promoterId} in Program ${programId}`,
            result
        };
    }

    @ApiResponse({ status: 204, description: 'No Content' })
    @Permissions('update', PromoterWebhook)
    @Patch(':webhook_id')
    async updatePromoterWebhook(
        @Param('program_id') programId: string,
        @Param('promoter_id') promoterId: string,
        @Param('webhook_id') webhookId: string,
        @Body() body: UpdatePromoterWebhookDto
    ) {
        this.logger.info(`START: updatePromoterWebhook controller`);

        await this.promoterWebhookService.updatePromoterWebhook(
            programId,
            promoterId,
            webhookId,
            body
        );

        this.logger.info(`END: updatePromoterWebhook controller`);
        return {
            message: `Successfully updated webhook ${webhookId} for Promoter ${promoterId} in Program ${programId}`
        };
    }

    @ApiResponse({ status: 204, description: 'No Content' })
    @Permissions('delete', PromoterWebhook)
    @Delete(':webhook_id')
    async deletePromoterWebhook(
        @Param('program_id') programId: string,
        @Param('promoter_id') promoterId: string,
        @Param('webhook_id') webhookId: string
    ) {
        this.logger.info(`START: deletePromoterWebhook controller`);

        await this.promoterWebhookService.deletePromoterWebhook(
            programId,
            promoterId,
            webhookId
        );

        this.logger.info(`END: deletePromoterWebhook controller`);
        return {
            message: `Successfully deleted webhook ${webhookId} for Promoter ${promoterId} in Program ${programId}`
        };
    }
}