import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse, UserDto } from '@org.quicko.cliq/ngx-core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class UserService {

	private baseUrl = environment.base_api_url;

	constructor(private httpClient: HttpClient) { }

	/**
	 * Create super admin (initial setup) - uses regular signup endpoint
	 */
	createSuperAdmin(body: any) {
		const url = `${this.baseUrl}/users/signup`;
		return this.httpClient.post<ApiResponse<UserDto>>(url, body);
	}

	/**
	 * Check if any user exists (to determine if setup is needed)
	 */
	checkIfSetupNeeded() {
		const url = `${this.baseUrl}/users/setup/check`;
		return this.httpClient.get<ApiResponse<{ setupNeeded: boolean }>>(url);
	}

	/**
	 * Get user by ID
	 */
	getUser(userId: string): Observable<ApiResponse<UserDto>> {
		const url = `${this.baseUrl}/users/${userId}`;
		return this.httpClient.get<ApiResponse<UserDto>>(url);
	}
}
