import { Injectable } from '@nestjs/common';
import { PaginatedListConverter } from './paginated-list.converter';
import { PromoterWebhookDto } from '../dtos';
import { PromoterWebhook } from '../entities';
import { PromoterWebhookConverter } from './promoterWebhook.converter';

@Injectable()
export class PromoterWebhookListConverter extends PaginatedListConverter<PromoterWebhook, PromoterWebhookDto> {
	constructor(promoterWebhookConverter: PromoterWebhookConverter) {
		super({
			convert: (entity) => promoterWebhookConverter.convert(entity),
		});
	}
}
