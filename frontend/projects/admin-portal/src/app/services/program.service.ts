import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface ProgramApiResponse {
    message: string;
    data: any;
}

@Injectable({
    providedIn: 'root'
})
export class ProgramService {

    constructor(private httpClient: HttpClient, private route: ActivatedRoute) { }

    private endpoint = `${environment.base_api_url}/programs`;

    getProgram(programId: string): Observable<ProgramApiResponse> {
        const url = `${this.endpoint}/${programId}`;
        return this.httpClient.get<ProgramApiResponse>(url);  
    }
getProgramReport(
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
                let fileName = 'program_report.csv';

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
}