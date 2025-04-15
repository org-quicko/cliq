import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, Injector } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { environment } from '../../../environments/environment.dev';
import { AuthService } from './auth.service';
import { ProgramStore } from '../store/program.store';
import { ApiResponse, MemberDto, UpdateMemberDto, SignUpMemberDto, MemberExistsInProgramDto } from '@org.quicko.cliq/ngx-core';
import { PromoterStore } from '../store/promoter.store';

@Injectable({
	providedIn: 'root'
})
export class MemberService {

	readonly programStore = inject(ProgramStore);

	private injector = inject(Injector);

	private getPromoter() {
		const promoterStore = this.injector.get(PromoterStore); // Lazily get PromoterStore
		return promoterStore.promoter();
	}

	constructor(private httpClient: HttpClient, private authService: AuthService) { }

	logIn(programId: string, member: MemberDto) {
		const url = `${this.getEndpoint(programId)}/members/login`;
		return this.httpClient.post<ApiResponse<{ access_token: string }>>(url, instanceToPlain(member));
	}

	signUp(programId: string, member: SignUpMemberDto) {
		const url = `${this.getEndpoint(programId)}/members/signup`;
		return this.httpClient.post<ApiResponse<any>>(url, instanceToPlain(member));
	}

	checkMemberExistenceInProgram(programId: string, memberExistence: MemberExistsInProgramDto) {
		const url = `${this.getEndpoint(programId)}/members/exists`;
		return this.httpClient.post<ApiResponse<any>>(url, instanceToPlain(memberExistence));
	}

	getMember(programId: string) {
		if (!this.authService.getMemberEmailId()) {
			throw new Error('Member not found');
		}

		const memberId = this.authService.getMemberId();

		const url = `${this.getEndpoint(programId)}/members/${memberId}`;

		return this.httpClient.get<ApiResponse<any>>(url);
	}

	updateMemberInfo(programId: string, updatedInfo: UpdateMemberDto) {
		if (!this.authService.getMemberEmailId()) {
			throw new Error('Member not found');
		}

		const memberId = this.authService.getMemberId();

		const url = `${this.getEndpoint(programId)}/members/${memberId}`;

		const body = instanceToPlain(updatedInfo);

		return this.httpClient.patch<ApiResponse<any>>(url, body);
	}

	leavePromoter(programId: string) {
		if (!this.authService.getMemberEmailId()) {
			throw new Error('Member not found');
		}

		const memberId = this.authService.getMemberId();

		const promoter = this.getPromoter();
		if (!promoter) {
			throw new Error('Promoter not found');
		}

		const url = `${this.getEndpoint(programId)}/members/${memberId}/promoters/${promoter.promoterId}`;

		return this.httpClient.patch<ApiResponse<any>>(url, {});
	}

	deleteAccount(programId: string) {
		if (!this.authService.getMemberEmailId()) {
			throw new Error('Member not found');
		}

		const memberId = this.authService.getMemberId();

		const url = `${this.getEndpoint(programId)}/members/${memberId}`;

		return this.httpClient.delete<ApiResponse<any>>(url);
	}

	getPromoterOfMember(programId: string) {
		if (!this.authService.getMemberEmailId()) {
			throw new Error('Member not found');
		}

		const memberId = this.authService.getMemberId();

		const url = `${this.getEndpoint(programId)}/members/${memberId}/promoter`;

		return this.httpClient.get<ApiResponse<any>>(url);
	}

	private getEndpoint(programId: string): string {
		return `${environment.base_api_url}/programs/${programId}`;
	}
}
