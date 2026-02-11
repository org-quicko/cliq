import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface ProgramApiResponse {
    message: string;
    data?: any;
    result?: any;
}

@Injectable({
    providedIn: 'root'
})
export class ProgramService {

    constructor(private httpClient: HttpClient, private route: ActivatedRoute) { }

    private endpoint = `${environment.base_api_url}/programs`;

    getAllPrograms(): Observable<ProgramApiResponse> {
        return this.httpClient.get<ProgramApiResponse>(this.endpoint);
    }

    getProgram(programId: string): Observable<ProgramApiResponse> {
        const url = `${this.endpoint}/${programId}`;
        return this.httpClient.get<ProgramApiResponse>(url);  
    }

    getCommissionsReport(
        programId: string,
        options?: {
            report_period?: string,
            start_date?: string,
            end_date?: string
        }
    ): Observable<{ blob: Blob, fileName: string }> {
        const url = `${this.endpoint}/${programId}/report`;

        let params = new HttpParams();
        if (options?.start_date) {
            params = params.set('start_date', options.start_date);
        }
        if (options?.end_date) {
            params = params.set('end_date', options.end_date);
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
        options?: {
            period?: string;
            startDate?: string;
            endDate?: string;
        }
    ): Observable<ProgramApiResponse> {
        const url = `${this.endpoint}/${programId}/analytics`;

        let params = new HttpParams();
        if (options?.period) {
            params = params.set('period', options.period);
        }
        if (options?.startDate) {
            params = params.set('startDate', options.startDate);
        }
        if (options?.endDate) {
            params = params.set('endDate', options.endDate);
        }

        return this.httpClient.get<ProgramApiResponse>(url, {
            params,
            headers: {
                'x-accept-type': 'application/json;format=sheet-json'
            }
        });
    }

    getPromoterAnalytics(
        programId: string,
        options?: {
            sortBy?: 'signup_commission' | 'signups' | 'purchase_commission' | 'revenue';
            period?: string;
            startDate?: string;
            endDate?: string;
            skip?: number;
            take?: number;
        }
    ): Observable<ProgramApiResponse> {
        const url = `${this.endpoint}/${programId}/analytics/promoters`;

        let params = new HttpParams();
        if (options?.sortBy) {
            params = params.set('sortBy', options.sortBy);
        }
        if (options?.period) {
            params = params.set('period', options.period);
        }
        if (options?.startDate) {
            params = params.set('startDate', options.startDate);
        }
        if (options?.endDate) {
            params = params.set('endDate', options.endDate);
        }
        if (options?.skip !== undefined) {
            params = params.set('skip', options.skip.toString());
        }
        if (options?.take !== undefined) {
            params = params.set('take', options.take.toString());
        }

        return this.httpClient.get<ProgramApiResponse>(url, { params });
    }



    /**
     * Get program summary list for super admin
     */
    getProgramSummary(
        options?: {
            programId?: string;
            name?: string;
            skip?: number;
            take?: number;
        }
    ): Observable<ProgramApiResponse> {
        const url = `${this.endpoint}/summary`;

        let params = new HttpParams();
        if (options?.programId) {
            params = params.set('program_id', options.programId);
        }
        if (options?.name) {
            params = params.set('name', options.name);
        }
        if (options?.skip !== undefined) {
            params = params.set('skip', options.skip.toString());
        }
        if (options?.take !== undefined) {
            params = params.set('take', options.take.toString());
        }

        return this.httpClient.get<ProgramApiResponse>(url, { params });
    }

    /**
     * Create a new program (Super Admin Only)
     */
    createProgram(body: any): Observable<ProgramApiResponse> {
        return this.httpClient.post<ProgramApiResponse>(this.endpoint, body);
    }
}