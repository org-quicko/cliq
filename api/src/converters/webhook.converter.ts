import { Injectable } from '@nestjs/common';
import { WebhookDto } from '../dtos';
import { Webhook } from '../entities';
import { ConverterException } from '@org-quicko/core';

@Injectable()
export class WebhookConverter {
	convert(webhook: Webhook): WebhookDto {
		try {
			const webhookDto = new WebhookDto();

			webhookDto.webhookId = webhook.webhookId;

			webhookDto.secret = webhook.secret;
			webhookDto.events = webhook.events;
			webhookDto.url = webhook.url;
			webhookDto.programId = webhook.programId;

			webhookDto.createdAt = webhook.createdAt;
			webhookDto.updatedAt = webhook.updatedAt;

			return webhookDto;
		} catch (error) {
			throw new ConverterException('Error converting Webhook entity to WebhookDto', error);
		}
	}
}
