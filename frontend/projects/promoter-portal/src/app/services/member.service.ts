import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, Injector } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { environment } from '../../../environments/environment.dev';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../../../org-quicko-cliq-core/src/lib/interfaces/apiResponse.interface';
import { MemberDto } from '../../../../org-quicko-cliq-core/src/lib/dtos/member.dto';
import { ProgramStore } from '../store/program.store';
import { UpdateMemberDto } from '@org.quicko.cliq/ngx-core';
import { PromoterStore } from '../store/promoter.store';

@Injectable({
	providedIn: 'root'
})
export class MemberService {

	readonly programStore = inject(ProgramStore);

	private injector = inject(Injector);

	private endpoint = computed(() => {
		const program = this.programStore.program();
		return program ? `${environment.base_api_url}/programs/${program.programId}` : null;
	});

	private getPromoter() {
		const promoterStore = this.injector.get(PromoterStore); // Lazily get PromoterStore
		return promoterStore.promoter();
	}

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

	updateMemberInfo(updatedInfo: UpdateMemberDto) {
		if (!this.authService.getMemberEmailId()) {
			throw new Error('Member not found');
		}

		const memberId = this.authService.getMemberId();

		const url = `${this.getEndpoint()}/members/${memberId}`;

		const body = instanceToPlain(updatedInfo);

		return this.httpClient.patch<ApiResponse<any>>(url, body, {
			headers: {
				Authorization: this.authService.getToken()
			}
		});
	}

	leavePromoter() {
		if (!this.authService.getMemberEmailId()) {
			throw new Error('Member not found');
		}

		const memberId = this.authService.getMemberId();

		const promoter = this.getPromoter();
		if (!promoter) {
			throw new Error('Promoter not found');
		}

		const url = `${this.getEndpoint()}/members/${memberId}/promoters/${promoter.promoterId}`;

		return this.httpClient.patch<ApiResponse<any>>(url, {}, {
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
