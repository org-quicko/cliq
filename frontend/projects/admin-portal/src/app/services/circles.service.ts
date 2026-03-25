import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, CircleDto, PaginatedList, FunctionDto } from '@org.quicko.cliq/ngx-core';
import { CircleWorkbook } from '@org-quicko/cliq-sheet-core/Circle/beans';

@Injectable({
    providedIn: 'root'
})
export class CirclesService {

    constructor(private httpClient: HttpClient) { }

    private endpoint = `${environment.base_api_url}/programs`;

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

    getCircle(
        programId: string,
        circleId: string,
    ): Observable<ApiResponse<CircleDto>> {
        const url = `${this.endpoint}/${programId}/circles/${circleId}`;
        return this.httpClient.get<ApiResponse<CircleDto>>(url);
    }

    getCircleFunctions(
        programId: string,
        circleId: string,
        skip?: number,
        take?: number,
    ): Observable<ApiResponse<PaginatedList<FunctionDto>>> {
        const url = `${this.endpoint}/${programId}/functions`;

        let params = new HttpParams();
        params = params.set('circle_id', circleId);
        if (skip !== undefined) {
            params = params.set('skip', skip.toString());
        }
        if (take !== undefined) {
            params = params.set('take', take.toString());
        }

        return this.httpClient.get<ApiResponse<PaginatedList<FunctionDto>>>(url, { params });
    }

    getCirclePromoters(
        programId: string,
        circleId: string,
        name?: string,
        skip?: number,
        take?: number,
    ): Observable<ApiResponse<any>> {
        const url = `${this.endpoint}/${programId}/circles/${circleId}/promoters`;

        let params = new HttpParams();
        if (name) {
            params = params.set('promoter_name', name);
        }
        if (skip !== undefined) {
            params = params.set('skip', skip.toString());
        }
        if (take !== undefined) {
            params = params.set('take', take.toString());
        }

        return this.httpClient.get<ApiResponse<any>>(url, { params });
    }
}
