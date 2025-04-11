import { HttpClient, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map } from "rxjs";
import {
	ApiResponse,
	commissionSortByEnum,
	conversionTypeEnum,
	CreateMemberDto,
	CreatePromoterDto,
	memberSortByEnum,
	referralSortByEnum,
	reportEnum,
	reportPeriodEnum,
	sortOrderEnum,
	statusEnum,
	UpdatePromoterDto,
	UpdatePromoterMemberDto
} from "@org.quicko.cliq/ngx-core";
import { instanceToPlain } from "class-transformer";
import { AuthService } from "./auth.service";
import { ProgramStore } from "../store/program.store";
import { environment } from "../../../environments/environment.dev";

@Injectable({
	providedIn: 'root'
})
export class PromoterService {

	readonly programStore = inject(ProgramStore);

	constructor(private httpClient: HttpClient, private authService: AuthService) { }

	createPromoter(programId: string, createdPromoter: CreatePromoterDto) {
		const url = this.getEndpoint(programId);

		const body = instanceToPlain(createdPromoter);

		return this.httpClient.post<ApiResponse<any>>(url, body, {
			headers: {
				Authorization: this.authService.getToken(),
				'x-accept-type': 'application/json;format=sheet-json'
			}
		});
	}

	registerForProgram(programId: string, promoterId: string, queryParams: { accepted_tnc?: boolean } = {}) {
		const url = this.getEndpoint(programId, promoterId) + '/register';

		if (!queryParams.accepted_tnc) queryParams.accepted_tnc = false;

		return this.httpClient.get<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken(),
				'x-accept-type': 'application/json;format=sheet-json'
			},
			params: queryParams
		});
	}

	getPromoterAnalytics(programId: string, promoterId: string) {
		const url = this.getEndpoint(programId, promoterId) + '/analytics';

		return this.httpClient.get<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken(),
				'x-accept-type': 'application/json;format=sheet-json'
			}
		});
	}

	updatePromoterInfo(programId: string, promoterId: string, updatedInfo: UpdatePromoterDto) {
		const url = this.getEndpoint(programId, promoterId);

		const body = instanceToPlain(updatedInfo);

		return this.httpClient.patch<ApiResponse<any>>(url, body, {
			headers: {
				Authorization: this.authService.getToken(),
			}
		});
	}

	removeMember(programId: string, promoterId: string, memberId: string) {
		const url = this.getEndpoint(programId, promoterId) + `/members/${memberId}`;

		return this.httpClient.patch<ApiResponse<any>>(url, {}, {
			headers: {
				Authorization: this.authService.getToken(),
			}
		});

	}

	updateMemberRole(programId: string, promoterId: string, memberId: string, updatedInfo: UpdatePromoterMemberDto) {
		const url = this.getEndpoint(programId, promoterId) + `/members/${memberId}/role`;

		const body = instanceToPlain(updatedInfo);

		return this.httpClient.patch<ApiResponse<any>>(url, body, {
			headers: {
				Authorization: this.authService.getToken(),
			}
		});
	}

	getPromoterCommissions(programId: string, promoterId: string, queryParams: { sort_by?: commissionSortByEnum, sort_order?: sortOrderEnum, link_id?: string, contact_id?: string, conversion_type?: conversionTypeEnum, skip?: number, take?: number }) {
		const url = this.getEndpoint(programId, promoterId) + '/commissions';

		if (!queryParams.skip) queryParams.skip = 0;
		if (!queryParams.take) queryParams.take = 5;
		if (!queryParams.link_id) delete queryParams.link_id;
		if (!queryParams.contact_id) delete queryParams.contact_id;
		if (!queryParams.conversion_type) delete queryParams.conversion_type;
		if (!queryParams.sort_by) delete queryParams.sort_by;
		if (!queryParams.sort_order) delete queryParams.sort_order;

		return this.httpClient.get<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken(),
				'x-accept-type': 'application/json;format=sheet-json',
			},
			params: queryParams
		});
	}

	getPromoterReferrals(
		programId: string,
		promoterId: string,
		queryParams: { sort_by?: referralSortByEnum, sort_order?: sortOrderEnum, skip?: number, take?: number }
	) {
		const url = this.getEndpoint(programId, promoterId) + '/referrals';

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

	getPromoterReferral(programId: string, promoterId: string, contactId: string) {
		const url = this.getEndpoint(programId, promoterId) + `/referrals/${contactId}`;

		return this.httpClient.get<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken(),
			},
		});
	}

	getReport(
		programId: string, promoterId: string,
		reportType: reportEnum,
		queryParams: { report_period?: reportPeriodEnum, start_date?: string, end_date?: string }
	) {
		const url = this.getEndpoint(programId, promoterId) + `/reports/${reportType}`;

		return this.httpClient.get(url, {
			headers: {
				Authorization: this.authService.getToken(),
				'x-accept-type': 'application/json;format=sheet-json'
			},
			params: queryParams,
			responseType: 'blob',
			observe: 'response'
		}).pipe(
			map((response: HttpResponse<Blob>) => {

				if (!response.body) {
					throw new Error(`Error. Failed to get commissions report`);
				}

				const contentDisposition = response.headers.get('content-disposition');

				let fileName = 'download.xlsx';

				if (contentDisposition) {
					const match = contentDisposition.match(/filename="(.+)"/);
					if (match) {
						fileName = match[1];
					}
				}

				return { blob: response.body, fileName };
			})
		)
	}

	getAllMembers(programId: string, promoterId: string, queryParams: { sort_by?: memberSortByEnum, sort_order?: sortOrderEnum, skip?: number, take?: number }) {
		const url = this.getEndpoint(programId, promoterId) + `/members`;

		if (!queryParams.skip) queryParams.skip = 0;
		if (!queryParams.take) queryParams.take = 5;
		if (!queryParams.sort_by) delete queryParams.sort_by;
		if (!queryParams.sort_order) delete queryParams.sort_order;

		return this.httpClient.get<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken(),
				'x-accept-type': 'application/json;format=sheet-json'
			},
			params: {
				...queryParams,
				status: statusEnum.ACTIVE,
			}
		})
	}

	addMember(programId: string, promoterId: string, member: CreateMemberDto) {
		const url = this.getEndpoint(programId, promoterId) + `/members`;

		const body = instanceToPlain(member);

		return this.httpClient.post<ApiResponse<any>>(url, body, {
			headers: {
				Authorization: this.authService.getToken(),
			}
		});
	}

	deletePromoter(programId: string, promoterId: string, ) {
		const url = this.getEndpoint(programId, promoterId);

		return this.httpClient.delete<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken(),
			}
		});
	}

	private getEndpoint(programId: string, promoterId?: string): string {
		if (promoterId) return `${environment.base_api_url}/programs/${programId}/promoters/${promoterId}`;
		else return `${environment.base_api_url}/programs/${programId}/promoters`;
	}
}
