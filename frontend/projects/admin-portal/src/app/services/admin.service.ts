import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { AuthService } from './auth.service';
import { ProgramStore } from '../store/program.store';
import { ApiResponse, MemberDto } from '@org.quicko.cliq/ngx-core';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class AdminService {

	readonly programStore = inject(ProgramStore);

	private baseUrl = environment.base_api_url;

	constructor(private httpClient: HttpClient, private authService: AuthService) { }

	private getEndpoint(programId: string) {
		return `${this.baseUrl}/programs/${programId}`;
	}

	logIn(admin: MemberDto) {
		const url = `${this.baseUrl}/users/login`;
		return this.httpClient.post<ApiResponse<{ access_token: string }>>(url, instanceToPlain(admin));
	}

	getAdmin(programId: string) {
		if (!this.authService.getMemberEmailId()) {
			throw new Error('Admin not found');
		}

		const adminId = this.authService.getMemberId();

		const url = `${this.getEndpoint(programId)}/admins/${adminId}`;

		return this.httpClient.get<ApiResponse<any>>(url);
	}
}
