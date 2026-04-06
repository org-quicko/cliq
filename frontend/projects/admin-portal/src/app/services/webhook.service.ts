import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ApiResponse, CreateWebhookDto, WebhookDto, PaginatedList } from '@org.quicko.cliq/ngx-core';


@Injectable({
	providedIn: 'root',
})
export class WebhookService {
	private endpoint = environment.base_api_url;

	constructor(private httpClient: HttpClient) {}

	getAllWebhooks(programId: string, skip: number = 0, take: number = 10) {
		const url = `${this.endpoint}/programs/${programId}/webhooks`;
		return this.httpClient.get<ApiResponse<PaginatedList<WebhookDto>>>(url, { params: { skip, take } });
	}

	createWebhook(programId: string, body: CreateWebhookDto) {
		const url = `${this.endpoint}/programs/${programId}/webhooks`;
		return this.httpClient.post<ApiResponse<WebhookDto>>(url, body);
	}

	deleteWebhook(programId: string, webhookId: string) {
		const url = `${this.endpoint}/programs/${programId}/webhooks/${webhookId}`;
		return this.httpClient.delete<ApiResponse<null>>(url);
	}
}
