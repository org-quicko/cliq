import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { eventQueueName } from "src/constants";
import { WebhookController } from "src/controllers/webhook.controller";
import { WebhookConverter } from "src/converters/webhook.converter";
import { Webhook } from "src/entities";
import { EventConsumer } from "src/queues/webhook.consumer";
import { WebhookService } from "src/services/webhook.service";
import { WebhookPublisherService } from "src/services/webhookPublisher.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Webhook]),
        BullModule.registerQueue({
            name: eventQueueName,
        }),
    ],
    controllers: [WebhookController],
    providers: [WebhookService, WebhookPublisherService, WebhookConverter, EventConsumer],
    exports: [WebhookService, WebhookConverter]
})
export class WebhookModule {

}