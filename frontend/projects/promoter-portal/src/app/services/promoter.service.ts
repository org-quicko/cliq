import { HttpClient, HttpResponse } from "@angular/common/http";
import { computed, inject, Injectable } from "@angular/core";
import { AuthService } from "./auth.service";
import { ProgramStore } from "../store/program.store";
import { PromoterStore } from "../store/promoter.store";
import { environment } from "../../../environments/environment.dev";
import { ApiResponse, conversionTypeEnum } from "@org.quicko.cliq/ngx-core";
import { reportPeriodEnum } from "../../../../org-quicko-cliq-core/src/lib/enums/reportPeriod.enum";
import { map } from "rxjs";

@Injectable({
	providedIn: 'root'
})
export class PromoterService {

	readonly programStore = inject(ProgramStore);

	readonly promoterStore = inject(PromoterStore);

	constructor(private httpClient: HttpClient, private authService: AuthService) { }

	private endpoint = computed(() => {
		const promoter = this.promoterStore.promoter();
		const program = this.programStore.program();

		return (promoter && program) ? `${environment.base_url}/programs/${program.programId}/promoters/${promoter.promoterId}` : null;
	});

	getPromoterStatistics() {
		const url = this.getEndpoint() + '/stats';

		return this.httpClient.get<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken(),
				'x-accept-type': 'application/json;format=sheet-json'
			}
		});
	}

	getPromoterCommissions(linkId?: string, conversionType?: conversionTypeEnum) {
		const url = this.getEndpoint() + '/commissions';

		return this.httpClient.get<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken(),
				'x-accept-type': 'application/json;format=sheet-json'
			}
		});
	}

	getPromoterReferrals(skip: number = 0, take: number = 4) {
		const url = this.getEndpoint() + '/referrals';

		return this.httpClient.get<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken(),
				'x-accept-type': 'application/json;format=sheet-json'
			},
			params: {
				skip,
				take
			}
		});
	}

	getReport(reportPeriod?: reportPeriodEnum, startDate?: Date, endDate?: Date) {
		const url = this.getEndpoint() + '/reports/commissions';

		return this.httpClient.get(url, {
			headers: {
				Authorization: this.authService.getToken(),
				'x-accept-type': 'application/json;format=sheet-json'
			},
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

	private getEndpoint(): string {
		const endpoint = this.endpoint();
		if (!endpoint) {
			console.log(endpoint);
			throw new Error(`Error. Failed to load endpoint for program`);
		}
		return endpoint;
	}
}
