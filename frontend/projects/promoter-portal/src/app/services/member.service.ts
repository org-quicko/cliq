import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { environment } from '../../../environments/environment.dev';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../../../org-quicko-cliq-core/src/lib/interfaces/apiResponse.interface';
import { MemberDto } from '../../../../org-quicko-cliq-core/src/lib/dtos/member.dto';
import { ProgramStore } from '../store/program.store';

@Injectable({
	providedIn: 'root'
})
export class MemberService {

	readonly programStore = inject(ProgramStore);

	private endpoint = computed(() => {
		const program = this.programStore.program();
		return program ? `${environment.base_url}/programs/${program.programId}` : null;
	});

	constructor(private httpClient: HttpClient, private authService: AuthService) { }

	logIn(member: MemberDto) {
		const url = `${this.getEndpoint()}/members/login`;
		return this.httpClient.post<ApiResponse<{ access_token: string }>>(url, instanceToPlain(member));
	}

	signUp(member: MemberDto) {
		const url = `${this.getEndpoint()}/members/signup`;
		return this.httpClient.post<ApiResponse<any>>(url, instanceToPlain(member));
	}

	getMember() {
		if (!this.authService.getMemberEmailId()) {
			throw new Error('Member not found');
		}

		const memberId = this.authService.getMemberId();

		const url = `${this.getEndpoint()}/members/${memberId}`;

		return this.httpClient.get<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken()
			}
		});
	}

	getPromoterOfMember() {
		if (!this.authService.getMemberEmailId()) {
			throw new Error('Member not found');
		}

		const memberId = this.authService.getMemberId();

		const url = `${this.getEndpoint()}/members/${memberId}/promoter`;

		return this.httpClient.get<ApiResponse<any>>(url, {
			headers: {
				Authorization: this.authService.getToken()
			}
		});
	}

	private getEndpoint(): string {

		const endpoint = this.endpoint();
		if (!endpoint) {
			console.log(endpoint);
			throw new Error(`Error. Failed to load endpoint for program`);
		}
		return endpoint;
	}
}
