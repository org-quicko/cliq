import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { PromoterStore } from '../store/promoter.store';
import { ProgramStore } from '../store/program.store';
import { instanceToPlain } from 'class-transformer';
import { ApiResponse, CreateLinkDto, linkSortByEnum, sortOrderEnum } from '@org.quicko.cliq/ngx-core';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class LinkService {

	readonly programStore = inject(ProgramStore);

	readonly promoterStore = inject(PromoterStore);

	constructor(private httpClient: HttpClient, private authService: AuthService) { }

	getPromoterLinkAnalytics(
		programId: string,
		promoterId: string,
		queryParams: { sort_by?: linkSortByEnum, sort_order?: sortOrderEnum, skip?: number, take?: number }
	) {
		const url = this.getEndpoint(programId, promoterId) + '/link_analytics';

		if (!queryParams.skip) queryParams.skip = 0;
		if (!queryParams.take) queryParams.take = 5;
		if (!queryParams.sort_by) delete queryParams.sort_by;
		if (!queryParams.sort_order) delete queryParams.sort_order;

		return this.httpClient.get<ApiResponse<any>>(url, {
			headers: {
				'x-accept-type': 'application/json;format=sheet-json'
			},
			params: queryParams
		});
	}

	createLink(programId: string, promoterId: string, body: CreateLinkDto) {
		const url = this.getEndpoint(programId, promoterId) + '/links';

		const newLink = instanceToPlain(body);

		return this.httpClient.post<ApiResponse<any>>(url, newLink);
	}

	getLink(programId: string, promoterId: string, linkId: string) {
		const url = this.getEndpoint(programId, promoterId) + `/links/${linkId}`;

		return this.httpClient.get<ApiResponse<any>>(url);
	}

	deleteLink(programId: string, promoterId: string, linkId: string) {
		const url = this.getEndpoint(programId, promoterId) + `/links/${linkId}`;

		return this.httpClient.patch<ApiResponse<any>>(url, {});
	}

	private getEndpoint(programId: string, promoterId: string): string {
		return `${environment.base_api_url}/programs/${programId}/promoters/${promoterId}`;
	}
}