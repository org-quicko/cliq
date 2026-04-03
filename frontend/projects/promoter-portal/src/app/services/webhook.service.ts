import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ApiResponse, CreatePromoterWebhookDto, PromoterWebhookDto, PaginatedList } from '@org.quicko.cliq/ngx-core';

@Injectable({
	providedIn: 'root',
})
export class WebhookService {
	private endpoint = environment.base_api_url;

	constructor(private httpClient: HttpClient) {}

	getAllWebhooks(programId: string, promoterId: string) {
		const url = `${this.endpoint}/programs/${programId}/promoters/${promoterId}/webhooks`;
		return this.httpClient.get<ApiResponse<PaginatedList<PromoterWebhookDto>>>(url);
	}

	createWebhook(programId: string, promoterId: string, body: CreatePromoterWebhookDto) {
		const url = `${this.endpoint}/programs/${programId}/promoters/${promoterId}/webhooks`;
		return this.httpClient.post<ApiResponse<PromoterWebhookDto>>(url, body);
	}

	deleteWebhook(programId: string, promoterId: string, webhookId: string) {
		const url = `${this.endpoint}/programs/${programId}/promoters/${promoterId}/webhooks/${webhookId}`;
		return this.httpClient.delete<ApiResponse<null>>(url);
	}
}
