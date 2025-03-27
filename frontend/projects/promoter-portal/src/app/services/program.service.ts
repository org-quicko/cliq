import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiResponse } from '../../../../org-quicko-cliq-core/src/lib/interfaces/apiResponse.interface';
import { ProgramDto } from '../../../../org-quicko-cliq-core/src/lib/dtos';

@Injectable({
	providedIn: 'root'
})
export class ProgramService {

	constructor(private httpClient: HttpClient, private route: ActivatedRoute) { }

	private endpoint = 'http://localhost:3000/programs';

	getProgram(programId: string) {
		const url = `${this.endpoint}/${programId}`;

		return this.httpClient.get<ApiResponse<any>>(url);
	}
}
