import { Injectable } from '@nestjs/common';
import { PromoterWebhookDto } from '../dtos';
import { PromoterWebhook } from '../entities';
import { ConverterException } from '@org-quicko/core';

@Injectable()
export class PromoterWebhookConverter {
    convert(webhook: PromoterWebhook): PromoterWebhookDto {
        try {
            const webhookDto = new PromoterWebhookDto();

            webhookDto.webhookId = webhook.webhookId;
            webhookDto.programId = webhook.programId;
            webhookDto.promoterId = webhook.promoterId;

            webhookDto.secret = webhook.secret;
            webhookDto.events = webhook.events;
            webhookDto.url = webhook.url;

            webhookDto.createdAt = webhook.createdAt;
            webhookDto.updatedAt = webhook.updatedAt;

            return webhookDto;
        } catch (error) {
            throw new ConverterException('Error converting PromoterWebhook entity to PromoterWebhookDto', error);
        }
    }
}