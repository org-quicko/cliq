import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, CircleDto, PaginatedList, FunctionDto, PromoterDto } from '@org.quicko.cliq/ngx-core';
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

    updateCircle(programId: string, circleId: string, body: { name: string }): Observable<ApiResponse<void>> {
        return this.httpClient.patch<ApiResponse<void>>(`${this.endpoint}/${programId}/circles/${circleId}`, body);
    }

    deleteCircle(programId: string, circleId: string): Observable<ApiResponse<void>> {
        return this.httpClient.delete<ApiResponse<void>>(`${this.endpoint}/${programId}/circles/${circleId}`);
    }

    getFunction(programId: string, functionId: string): Observable<ApiResponse<FunctionDto>> {
        return this.httpClient.get<ApiResponse<FunctionDto>>(`${this.endpoint}/${programId}/functions/${functionId}`);
    }

    createFunction(programId: string, body: Record<string, unknown>): Observable<ApiResponse<FunctionDto>> {
        return this.httpClient.post<ApiResponse<FunctionDto>>(`${this.endpoint}/${programId}/functions`, body);
    }

    updateFunction(programId: string, functionId: string, body: Record<string, unknown>): Observable<ApiResponse<void>> {
        return this.httpClient.patch<ApiResponse<void>>(`${this.endpoint}/${programId}/functions/${functionId}`, body);
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

    deleteFunction(programId: string, functionId: string): Observable<ApiResponse<void>> {
        return this.httpClient.delete<ApiResponse<void>>(`${this.endpoint}/${programId}/functions/${functionId}`);
    }

    getCirclePromoters(
        programId: string,
        circleId: string,
        query?: string,
        skip?: number,
        take?: number,
    ): Observable<ApiResponse<PaginatedList<PromoterDto>>> {
        const url = `${this.endpoint}/${programId}/circles/${circleId}/promoters`;

        let params = new HttpParams();
        if (query) {
            params = params.set('query', query);
        }
        if (skip !== undefined) {
            params = params.set('skip', skip.toString());
        }
        if (take !== undefined) {
            params = params.set('take', take.toString());
        }

        return this.httpClient.get<ApiResponse<PaginatedList<PromoterDto>>>(url, { params });
    }
}
