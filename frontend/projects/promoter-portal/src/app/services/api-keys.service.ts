import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ApiKeyDto, ApiResponse } from '@org.quicko.cliq/ngx-core';

@Injectable({
	providedIn: 'root',
})
export class ApiKeysService {
	private endpoint = environment.base_api_url;

	constructor(private httpClient: HttpClient) {}

	fetchApiKey(programId: string, promoterId: string) {
		const url = `${this.endpoint}/programs/${programId}/promoters/${promoterId}/api-keys`;
		return this.httpClient.get<ApiResponse<ApiKeyDto>>(url);
	}

	generateApiKey(programId: string, promoterId: string) {
		const url = `${this.endpoint}/programs/${programId}/promoters/${promoterId}/api-keys`;
		return this.httpClient.post<ApiResponse<ApiKeyDto>>(url, {});
	}
}
