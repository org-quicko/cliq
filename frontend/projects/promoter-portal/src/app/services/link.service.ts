import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.dev';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../../../org-quicko-cliq-core/src/lib/interfaces/apiResponse.interface';
import { PromoterStore } from '../store/promoter.store';
import { ProgramStore } from '../store/program.store';
import { CreateLinkDto } from '../../../../org-quicko-cliq-core/src/lib/dtos';
import { instanceToPlain } from 'class-transformer';

@Injectable({
	providedIn: 'root'
})
export class LinkService {

	readonly programStore = inject(ProgramStore);

	readonly promoterStore = inject(PromoterStore);

	private endpoint = computed(() => {
		const promoter = this.promoterStore.promoter();
		const program = this.programStore.program();
		return (promoter && program) ? `${environment.base_api_url}/programs/${program.programId}/promoters/${promoter.promoterId}` : null;
	});

	constructor(private httpClient: HttpClient, private authService: AuthService) {

	}

	getPromoterLinkStatistics(queryParams: { skip?: number, take?: number }) {
		const url = this.getEndpoint() + '/link_stats';

		if (!queryParams.skip) queryParams.skip = 0;
		if (!queryParams.take) queryParams.take = 5;

		return this.httpClient.get<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken(),
				'x-accept-type': 'application/json;format=sheet-json'
			},
			params: queryParams
		});
	}

	createLink(body: CreateLinkDto) {
		const url = this.getEndpoint() + '/links';

		const newLink = instanceToPlain(body);

		return this.httpClient.post<ApiResponse<any>>(url, newLink, {
			headers: {
				Authorization: this.authService.getToken(),
			}
		});
	}

	getLink(linkId: string) {
		const url = this.getEndpoint() + `/links/${linkId}`;

		return this.httpClient.get<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken(),
			}
		});
	}

	deleteLink(linkId: string) {
		const url = this.getEndpoint() + `/links/${linkId}`;

		return this.httpClient.patch<ApiResponse<any>>(url, {}, {
			headers: {
				Authorization: this.authService.getToken(),
			}
		});
	}

	private getEndpoint(): string {

		const endpoint = this.endpoint();
		if (!endpoint) {
			console.log(endpoint);
			throw new Error(`Error. Failed to load endpoint for program`);
		}
		return endpoint;
	}
}
