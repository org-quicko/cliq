import { Injectable } from '@nestjs/common';
import { WebhookDto } from 'src/dtos';
import { Webhook } from 'src/entities';

@Injectable()
export class WebhookConverter {
    convert(webhook: Webhook): WebhookDto {
        const webhookDto = new WebhookDto();

        webhookDto.webhookId = webhook.webhookId;

        webhookDto.secret = webhook.secret;
        webhookDto.events = webhook.events;
        webhookDto.url = webhook.url;
        webhookDto.programId  = webhook.programId;

        webhookDto.createdAt = webhook.createdAt;
        webhookDto.updatedAt = webhook.updatedAt;

        return webhookDto;
    }
}
