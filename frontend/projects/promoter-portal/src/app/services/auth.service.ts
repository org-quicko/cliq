import { computed, inject, Injectable } from '@angular/core';
import { JwtHelperService } from "@auth0/angular-jwt";
import { CookieService } from 'ngx-cookie-service';
import * as _ from 'lodash-es';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { instanceToPlain } from 'class-transformer';
import { environment } from '../../../environments/environment.dev';
import { MemberDto } from '../../../../org-quicko-cliq-core/src/lib/dtos/member.dto';
import { ProgramStore } from '../store/program.store';

@Injectable({
	providedIn: 'root'
})
export class AuthService {

	private baseUrl = environment.base_api_url;

	readonly programStore = inject(ProgramStore);

	readonly programId = computed(() => this.programStore.program()!.programId);

	constructor(private cookieService: CookieService, private httpClient: HttpClient) {
		this.authenticated = new BehaviorSubject(this.isAuthenticated());
	}

	signIn(member: MemberDto) {
		const url = `${this.baseUrl}/signin`;
		return this.httpClient.post<any>(url, instanceToPlain(member));
	}

	authenticated: BehaviorSubject<any>;
	jwtHelper: JwtHelperService = new JwtHelperService();

	getAuthenticated() {
		return this.authenticated.asObservable();
	}

	setAuthenticated(isAuthenticated: any) {
		this.authenticated.next(isAuthenticated);
	}

	public setToken(token: string): void {
		if (environment.production) {

			// TODO: the domain must be custom domain
			this.cookieService.set('CLIQ_ACCESS_TOKEN', 'Bearer ' + token, 1, '/', undefined, true, 'Strict');
		}
		else {
			this.cookieService.set('CLIQ_ACCESS_TOKEN', 'Bearer ' + token, undefined, undefined, undefined, false, 'Strict');
		}
	}

	// public unsetToken(): void {
	// 	if (environment.production) {
	// 		this.cookieService.delete('CLIQ_ACCESS_TOKEN', '/', undefined, true, 'Strict');
	// 	}
	// 	else {
	// 		this.cookieService.delete('CLIQ_ACCESS_TOKEN', undefined, undefined, false, 'Strict');
	// 	}
	// }

	public deleteToken() {
		this.cookieService.delete('CLIQ_ACCESS_TOKEN', `/${this.programId()}`, undefined, true, 'Strict');
	}

	public getToken(): string {
		return this.cookieService.get('CLIQ_ACCESS_TOKEN');
	}

	public getMemberEmailId(): string | null {
		if (this.getToken() != null && this.getToken() != '') {
			const jwtToken = this.jwtHelper.decodeToken(this.getToken());
			return jwtToken['email'];
		}
		return null;
	}

	public getMemberId(): string | null {
		if (this.getToken() != null && this.getToken() != '') {
			const jwtToken = this.jwtHelper.decodeToken(this.getToken());
			return jwtToken['sub'];
		}
		return null;
	}

	public getAudience(): string | null {
		if (this.getToken() != null && this.getToken() != '') {
			const jwtToken = this.jwtHelper.decodeToken(this.getToken());
			return jwtToken['aud'];
		}
		return null;
	}

	public isAuthenticated(): boolean {
		try {
			const jwtToken = this.getToken();
			if (jwtToken != null) {

				const token = jwtToken.split('.');
				if (token && _.size(token) == 3 && this.jwtHelper.decodeToken(jwtToken) && !this.jwtHelper.isTokenExpired(jwtToken)) {
					return true;
				}
			}
		} catch (error) {
			return false;
		}
		return false;
	}

	getTokenExpiry(token: string): Date {
		return this.jwtHelper.getTokenExpirationDate(token)!;
	}

	isTokenExpired(token: string): boolean {
		return this.jwtHelper.isTokenExpired(token);
	}
}
