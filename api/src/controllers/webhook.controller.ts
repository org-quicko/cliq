import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    Headers
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Permissions } from "src/decorators/permissions.decorator";
import { Webhook } from "src/entities";
import { AuthGuard } from "src/guards/auth.guard";
import { WebhookService } from "src/services/webhook.service";
import { CreateWebhookDto, UpdateWebhookDto } from "src/dtos";
import { LoggerService } from "src/services/logger.service";
import { ApiKeyGuard } from "src/guards/apiKey.guard";

@ApiTags('Webhooks')
@UseGuards(AuthGuard, ApiKeyGuard)
@Controller('webhooks')
export class WebhookController {
    constructor(
        private readonly webhookService: WebhookService,
        
        private logger: LoggerService,
    ) { }

    @ApiResponse({ status: 201, description: 'Created' })
    @Permissions('create', Webhook)
    @Post()
    async createWebhook(@Headers('program_id') programId: string, @Body() body: CreateWebhookDto) {
        this.logger.info(`START: createWebhook controller`);
        
        const result = await this.webhookService.createWebhook(programId, body);
        
        this.logger.info(`END: createWebhook controller`);
        return { message: `Successfully created webhook for Program ${programId}`, result };
    }

    @ApiResponse({ status: 200, description: 'OK' })
    @Permissions('read_all', Webhook)
    @Get()
    async getAllWebhooks(@Headers('program_id') programId: string) {
        this.logger.info(`START: getAllWebhooks controller`);

        const result = await this.webhookService.getAllWebhooks(programId);

        this.logger.info(`END: getAllWebhooks controller`);

        return { message: `Successfully fetched all webhooks for Program ${programId}`, result };
    }

    @ApiResponse({ status: 200, description: 'OK' })
    @Permissions('read', Webhook)
    @Get(':webhook_id')
    async getWebhook(@Headers('program_id') programId: string, @Param('webhook_id') webhookId: string) {
        this.logger.info(`START: getWebhook controller`);
        
        const result = await this.webhookService.getWebhook(programId, webhookId);
        
        this.logger.info(`END: getWebhook controller`);
        return { message: `Successfully fetched webhook ${webhookId} for Program ${programId}`, result };
    }

    @ApiResponse({ status: 204, description: 'No Content' })
    @Permissions('update', Webhook)
    @Patch(':webhook_id')
    async updateWebhook(
        @Headers('program_id') programId: string, 
        @Param('webhook_id') webhookId: string,
        @Body() body: UpdateWebhookDto
    ) {
        this.logger.info(`START: updateWebhook controller`);
        
        await this.webhookService.updateWebhook(programId, webhookId, body);

        this.logger.info(`END: updateWebhook controller`);
        return { message: `Successfully updated webhook ${webhookId} for Program ${programId}`};
    }

    @ApiResponse({ status: 204, description: 'No Content' })
    @Permissions('delete', Webhook)
    @Delete(':webhook_id')
    async deleteWebhook(@Headers('program_id') programId: string, @Param('webhook_id') webhookId: string) {
        this.logger.info(`START: deleteWebhook controller`);

        await this.webhookService.deleteWebhook(programId, webhookId);

        this.logger.info(`END: deleteWebhook controller`);
        return { message: `Successfully deleted webhook ${webhookId} for Program ${programId}`};
    }
}
