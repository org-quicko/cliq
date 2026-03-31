import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { eventQueueName } from "src/constants";
import { WebhookController } from "src/controllers/webhook.controller";
import { PromoterWebhookController } from "src/controllers/promoterWebhook.controller";
import { WebhookConverter } from "src/converters/webhook.converter";
import { Webhook } from "src/entities";
import { EventConsumer } from "src/queues/webhook.consumer";
import { WebhookService } from "src/services/webhook.service";
import { WebhookPublisherService } from "src/services/webhookPublisher.service";
import { PromoterWebhook } from "src/entities/promoterWebhook.entity";
import { PromoterWebhookService } from "src/services/promoterWebhook.service";
import { PromoterWebhookConverter } from "src/converters/promoterWebhook.converter";
import { PromoterWebhookPublisherService } from "src/services/promoterWebhookPublisher.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Webhook, PromoterWebhook]),
        BullModule.registerQueue({
            name: eventQueueName,
        }),
    ],
    controllers: [WebhookController, PromoterWebhookController],
    providers: [WebhookService, WebhookPublisherService, WebhookConverter, EventConsumer, PromoterWebhookService, PromoterWebhookConverter, PromoterWebhookPublisherService],
    exports: [WebhookService, WebhookConverter, PromoterWebhookService, PromoterWebhookConverter]
})
export class WebhookModule {

}