import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, ProgramDto, ReferralDto, PaginatedList, referralSortByEnum, SortByEnum } from '@org.quicko.cliq/ngx-core';
import { ProgramAnalyticsWorkbook } from '@org-quicko/cliq-sheet-core/ProgramAnalytics/beans';
import { PromotersAnalyticsWorkbook } from '@org-quicko/cliq-sheet-core/PromoterAnalytics/beans';
import { PromoterWorkbook } from '@org-quicko/cliq-sheet-core/Promoter/beans';
import { ProgramSummaryViewWorkbook } from '@org-quicko/cliq-sheet-core/ProgramSummaryView/beans';
import { CircleWorkbook } from '@org-quicko/cliq-sheet-core/Circle/beans';

@Injectable({
    providedIn: 'root'
})
export class ProgramService {

    constructor(private httpClient: HttpClient, private route: ActivatedRoute) { }

    private endpoint = `${environment.base_api_url}/programs`;

    getAllPrograms(): Observable<ApiResponse<ProgramDto[]>> {
        return this.httpClient.get<ApiResponse<ProgramDto[]>>(this.endpoint);
    }

    getProgram(programId: string): Observable<ApiResponse<ProgramDto>> {
        const url = `${this.endpoint}/${programId}`;
        return this.httpClient.get<ApiResponse<ProgramDto>>(url);
    }

    getCommissionsReport(
        programId: string,
        startDate?: string,
        endDate?: string
    ): Observable<{ blob: Blob, fileName: string }> {
        const url = `${this.endpoint}/${programId}/report`;

        let params = new HttpParams();
        if (startDate) {
            params = params.set('start_date', startDate);
        }
        if (endDate) {
            params = params.set('end_date', endDate);
        }

        return this.httpClient.get(url, {
            params,
            headers: {
                'x-accept-type': 'application/json;format=sheet-json'
            },
            responseType: 'blob',
            observe: 'response'
        }).pipe(
            map(response => {
                const contentDisposition = response.headers.get('Content-Disposition');
                let fileName = 'commission_report.csv';

                if (contentDisposition) {
                    const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (matches && matches[1]) {
                        fileName = matches[1].replace(/['"]/g, '');
                    }
                }

                return {
                    blob: response.body as Blob,
                    fileName
                };
            })
        );
    }

    getProgramAnalytics(
        programId: string,
        period?: string,
        startDate?: string,
        endDate?: string
    ): Observable<ApiResponse<ProgramAnalyticsWorkbook>> {
        const url = `${this.endpoint}/${programId}/analytics`;

        let params = new HttpParams();
        if (period) {
            params = params.set('period', period);
        }
        if (startDate) {
            params = params.set('startDate', startDate);
        }
        if (endDate) {
            params = params.set('endDate', endDate);
        }

        return this.httpClient.get<ApiResponse<ProgramAnalyticsWorkbook>>(url, {
            params,
            headers: {
                'x-accept-type': 'application/json;format=sheet-json'
            }
        });
    }

    getPromoterAnalytics(
        programId: string,
        sortBy?: SortByEnum,
        period?: string,
        startDate?: string,
        endDate?: string,
        skip?: number,
        take?: number
    ): Observable<ApiResponse<PromotersAnalyticsWorkbook>> {
        const url = `${this.endpoint}/${programId}/analytics/promoters`;

        let params = new HttpParams();
        if (sortBy) {
            params = params.set('sortBy', sortBy);
        }
        if (period) {
            params = params.set('period', period);
        }
        if (startDate) {
            params = params.set('startDate', startDate);
        }
        if (endDate) {
            params = params.set('endDate', endDate);
        }
        if (skip !== undefined) {
            params = params.set('skip', skip.toString());
        }
        if (take !== undefined) {
            params = params.set('take', take.toString());
        }

        return this.httpClient.get<ApiResponse<PromotersAnalyticsWorkbook>>(url, { params });
    }



    /**
     * Get program summary list for super admin
     */
    getProgramSummary(
        programId?: string,
        name?: string,
        skip?: number,
        take?: number
    ): Observable<ApiResponse<ProgramSummaryViewWorkbook>> {
        const url = `${this.endpoint}/summary`;

        let params = new HttpParams();
        if (programId) {
            params = params.set('program_id', programId);
        }
        if (name) {
            params = params.set('name', name);
        }
        if (skip !== undefined) {
            params = params.set('skip', skip.toString());
        }
        if (take !== undefined) {
            params = params.set('take', take.toString());
        }

        return this.httpClient.get<ApiResponse<ProgramSummaryViewWorkbook>>(url, { params });
    }

    /**
     * Create a new program (Super Admin Only)
     */
    createProgram(body: any): Observable<ApiResponse<ProgramDto>> {
        return this.httpClient.post<ApiResponse<ProgramDto>>(this.endpoint, body);
    }



    getProgramReferrals(
        programId: string,
        query?: string,
        sortBy: referralSortByEnum = referralSortByEnum.UPDATED_AT,
        order?: 'ASC' | 'DESC',
        skip?: number,
        take?: number
    ): Observable<ApiResponse<PaginatedList<ReferralDto>>> {

        const url = `${this.endpoint}/${programId}/referrals`;

        let params = new HttpParams();

        if (query) {
            params = params.set('query', query);
        }

        if (sortBy) {
            params = params.set('sort_by', sortBy);
        }

        if (order) {
            params = params.set('sort_order', order);
        }

        if (skip !== undefined) {
            params = params.set('skip', skip.toString());
        }

        if (take !== undefined) {
            params = params.set('take', take.toString());
        }

        return this.httpClient.get<ApiResponse<PaginatedList<ReferralDto>>>(url, { params });
    }

    getAllPromoters(
        programId: string,
        name?: string,
        skip?: number,
        take?: number,
        order?: 'ASC' | 'DESC',
    ): Observable<ApiResponse<PromotersAnalyticsWorkbook>> {
        const url = `${this.endpoint}/${programId}/promoters`;

        let params = new HttpParams();
        if (name) {
            params = params.set('name', name);
        }
        if (skip !== undefined) {
            params = params.set('skip', skip.toString());
        }
        if (take !== undefined) {
            params = params.set('take', take.toString());
        }
        if (order) {
            params = params.set('order', order);
        }

        return this.httpClient.get<ApiResponse<PromotersAnalyticsWorkbook>>(url, { params });
    }

    getPromoterSummaryAnalytics(
        programId: string,
        promoterId: string,
        period?: string,
        startDate?: string,
        endDate?: string,
    ): Observable<ApiResponse<PromoterWorkbook>> {
        const url = `${this.endpoint}/${programId}/promoters/${promoterId}/summary`;

        let params = new HttpParams();
        if (period) {
            params = params.set('period', period);
        }
        if (startDate) {
            params = params.set('startDate', startDate);
        }
        if (endDate) {
            params = params.set('endDate', endDate);
        }

        return this.httpClient.get<ApiResponse<PromoterWorkbook>>(url, { params });
    }

    getPromoterLinksSummary(
        programId: string,
        promoterId: string,
        period?: string,
        startDate?: string,
        endDate?: string,
        skip?: number,
        take?: number,
        sortOrder?: 'ASC' | 'DESC',
    ): Observable<ApiResponse<PromoterWorkbook>> {
        const url = `${this.endpoint}/${programId}/promoters/${promoterId}/links-summary`;

        let params = new HttpParams();
        if (period) {
            params = params.set('period', period);
        }
        if (startDate) {
            params = params.set('startDate', startDate);
        }
        if (endDate) {
            params = params.set('endDate', endDate);
        }
        if (skip !== undefined) {
            params = params.set('skip', skip.toString());
        }
        if (take !== undefined) {
            params = params.set('take', take.toString());
        }
        if (sortOrder) {
            params = params.set('sort_order', sortOrder);
        }

        return this.httpClient.get<ApiResponse<PromoterWorkbook>>(url, { params });
    }

    getAllCircles(
        programId: string,
        name?: string,
        skip?: number,
        take?: number,
    ): Observable<ApiResponse<CircleWorkbook>> {
        const url = `${this.endpoint}/${programId}/circles`;

        let params = new HttpParams();
        if (name) {
            params = params.set('name', name);
        }
        if (skip !== undefined) {
            params = params.set('skip', skip.toString());
        }
        if (take !== undefined) {
            params = params.set('take', take.toString());
        }

        return this.httpClient.get<ApiResponse<CircleWorkbook>>(url, { params });
    }
}
