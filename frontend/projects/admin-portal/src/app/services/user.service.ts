import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse, LoginDto, UserDto, ProgramUserDto } from '@org.quicko.cliq/ngx-core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { instanceToPlain } from 'class-transformer';
import { AuthService } from './auth.service';

@Injectable({
	providedIn: 'root'
})
export class UserService {

	private baseUrl = environment.base_api_url;

	constructor(
		private httpClient: HttpClient,
		private authService: AuthService
	) { }

	/**
	 * User login - returns access token
	 */
	logIn(user: LoginDto) {
		const url = `${this.baseUrl}/users/login`;
		return this.httpClient.post<ApiResponse<{ access_token: string }>>(url, instanceToPlain(user));
	}

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

	/**
	 * Get current logged-in user details for a specific program
	 */
	getUserInProgram(programId: string): Observable<ApiResponse<ProgramUserDto>> {
		if (!this.authService.getUserEmail()) {
			throw new Error('User not found');
		}

		const userId = this.authService.getUserId();
		const url = `${this.baseUrl}/programs/${programId}/users/${userId}`;

		return this.httpClient.get<ApiResponse<ProgramUserDto>>(url);
	}
}
