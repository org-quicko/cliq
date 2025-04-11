import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.dev';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../../../org-quicko-cliq-core/src/lib/interfaces/apiResponse.interface';
import { PromoterStore } from '../store/promoter.store';
import { ProgramStore } from '../store/program.store';
import { CreateLinkDto } from '../../../../org-quicko-cliq-core/src/lib/dtos';
import { instanceToPlain } from 'class-transformer';
import { linkSortByEnum, sortOrderEnum } from '@org.quicko.cliq/ngx-core';

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
				Authorization: this.authService.getToken(),
				'x-accept-type': 'application/json;format=sheet-json'
			},
			params: queryParams
		});
	}

	createLink(programId: string, promoterId: string, body: CreateLinkDto) {
		const url = this.getEndpoint(programId, promoterId) + '/links';

		const newLink = instanceToPlain(body);

		return this.httpClient.post<ApiResponse<any>>(url, newLink, {
			headers: {
				Authorization: this.authService.getToken(),
			}
		});
	}

	getLink(programId: string, promoterId: string, linkId: string) {
		const url = this.getEndpoint(programId, promoterId) + `/links/${linkId}`;

		return this.httpClient.get<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken(),
			}
		});
	}

	deleteLink(programId: string, promoterId: string, linkId: string) {
		const url = this.getEndpoint(programId, promoterId) + `/links/${linkId}`;

		return this.httpClient.patch<ApiResponse<any>>(url, {}, {
			headers: {
				Authorization: this.authService.getToken(),
			}
		});
	}

	private getEndpoint(programId: string, promoterId: string): string {
		return `${environment.base_api_url}/programs/${programId}/promoters/${promoterId}`;
	}
}
