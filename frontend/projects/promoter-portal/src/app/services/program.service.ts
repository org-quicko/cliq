import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiResponse } from '@org.quicko.cliq/ngx-core';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class ProgramService {

	constructor(private httpClient: HttpClient, private route: ActivatedRoute) { }

	private endpoint = `${environment.base_api_url}/programs`;

	getProgram(programId: string) {
		const url = `${this.endpoint}/${programId}`;

		return this.httpClient.get<ApiResponse<any>>(url);
	}
}
