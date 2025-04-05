import { HttpClient, HttpResponse } from "@angular/common/http";
import { computed, inject, Injectable, Injector } from "@angular/core";
import { map } from "rxjs";
import { ApiResponse, conversionTypeEnum, CreateMemberDto, memberSortByEnum, referralSortByEnum, reportEnum, reportPeriodEnum, sortOrderEnum, statusEnum, UpdatePromoterDto, UpdatePromoterMemberDto } from "@org.quicko.cliq/ngx-core";
import { instanceToPlain } from "class-transformer";
import { AuthService } from "./auth.service";
import { ProgramStore } from "../store/program.store";
import { PromoterStore } from "../store/promoter.store";
import { environment } from "../../../environments/environment.dev";

@Injectable({
	providedIn: 'root'
})
export class PromoterService {

	readonly programStore = inject(ProgramStore);

	// this is for lazy injection of promoter store -> this is to break the circular dependency of the store and service on each other
	private injector = inject(Injector);

	constructor(private httpClient: HttpClient, private authService: AuthService) { }

	private endpoint = computed(() => {
		const program = this.programStore.program();
		const promoter = this.getPromoter();

		return (promoter && program) ? `${environment.base_api_url}/programs/${program.programId}/promoters/${promoter.promoterId}` : null;
	});

	private getPromoter() {
		const promoterStore = this.injector.get(PromoterStore); // Lazily get PromoterStore
		return promoterStore.promoter();
	}

	getPromoterStatistics() {
		const url = this.getEndpoint() + '/stats';

		return this.httpClient.get<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken(),
				'x-accept-type': 'application/json;format=sheet-json'
			}
		});
	}

	updatePromoterInfo(updatedInfo: UpdatePromoterDto) {
		const url = this.getEndpoint();

		const body = instanceToPlain(updatedInfo);

		return this.httpClient.patch<ApiResponse<any>>(url, body, {
			headers: {
				Authorization: this.authService.getToken(),
			}
		});
	}

	removeMember(memberId: string) {
		const url = this.getEndpoint() + `/members/${memberId}`;

		return this.httpClient.patch<ApiResponse<any>>(url, {}, {
			headers: {
				Authorization: this.authService.getToken(),
			}
		});

	}

	updateMemberRole(memberId: string, updatedInfo: UpdatePromoterMemberDto) {
		const url = this.getEndpoint() + `/members/${memberId}/role`;

		const body = instanceToPlain(updatedInfo);

		return this.httpClient.patch<ApiResponse<any>>(url, body, {
			headers: {
				Authorization: this.authService.getToken(),
			}
		});
	}

	getPromoterCommissions(
		queryParams: { link_id?: string, contact_id?: string, conversion_type?: conversionTypeEnum, skip?: number, take?: number }) {
		const url = this.getEndpoint() + '/commissions';

		if (!queryParams.skip) queryParams.skip = 0;
		if (!queryParams.take) queryParams.take = 5;
		if (!queryParams.link_id) delete queryParams.link_id;
		if (!queryParams.contact_id) delete queryParams.contact_id;
		if (!queryParams.conversion_type) delete queryParams.conversion_type;

		return this.httpClient.get<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken(),
				'x-accept-type': 'application/json;format=sheet-json',
			},
			params: queryParams
		});
	}

	getPromoterReferrals(queryParams: { sort_by?: referralSortByEnum, sort_order?: sortOrderEnum, skip?: number, take?: number }) {
		const url = this.getEndpoint() + '/referrals';

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

	getPromoterReferral(contactId: string) {
		const url = this.getEndpoint() + `/referrals/${contactId}`;

		return this.httpClient.get<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken(),
			},
		});
	}

	getReport(
		reportType: reportEnum,
		queryParams: { report_period?: reportPeriodEnum, start_date?: string, end_date?: string }
	) {
		const url = this.getEndpoint() + `/reports/${reportType}`;

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

	getAllMembers(
		queryParams: { sort_by?: memberSortByEnum, sort_order?: sortOrderEnum, skip?: number, take?: number }
	) {
		const url = this.getEndpoint() + `/members`;

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

	addMember(member: CreateMemberDto) {
		const url = this.getEndpoint() + `/members`;

		const body = instanceToPlain(member);

		return this.httpClient.post<ApiResponse<any>>(url, body, {
			headers: {
				Authorization: this.authService.getToken(),
			}
		});
	}

	deletePromoter() {
		const url = this.getEndpoint();

		return this.httpClient.delete<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken(),
			}
		});
	}

	private getEndpoint(): string {
		const endpoint = this.endpoint();
		if (!endpoint) {
			console.error(`Error. Failed to load endpoint for program`, endpoint);
			throw new Error(`Error. Failed to load endpoint for program`);
		}
		return endpoint;
	}
}
