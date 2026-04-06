import { Injectable } from '@nestjs/common';
import { PaginatedListConverter } from './paginated-list.converter';
import { WebhookDto } from '../dtos';
import { Webhook } from '../entities';
import { WebhookConverter } from './webhook.converter';

@Injectable()
export class WebhookListConverter extends PaginatedListConverter<Webhook, WebhookDto> {
	constructor(webhookConverter: WebhookConverter) {
		super({
			convert: (entity) => webhookConverter.convert(entity),
		});
	}
}
