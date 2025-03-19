import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { environment } from '../../environments/environment.dev';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../../org-quicko-cliq-core/src/lib/interfaces/apiResponse.interface';
import { MemberDto } from '../../../org-quicko-cliq-core/src/lib/dtos/member.dto';

@Injectable({
	providedIn: 'root'
})
export class MemberService {

	// TODO: the program ID needs to be checked for existence, otherwise the URL is not valid
	private endpoint = environment.base_url + `/programs/${environment.program_id}`;

	constructor(private httpClient: HttpClient, private authService: AuthService) { }

	signIn(member: MemberDto) {
		const url = `${this.endpoint}/members/login`;
		return this.httpClient.post<ApiResponse<any>>(url, instanceToPlain(member));
	}

	signUp(member: MemberDto) {
		const url = `${this.endpoint}/members/signup`;
		return this.httpClient.post<ApiResponse<any>>(url, instanceToPlain(member));
	}

	getMember() {
		if (!this.authService.getMemberEmailId()) {
			throw new Error('Member not found');
		}

		const memberId = this.authService.getMemberId();

		const url = `${this.endpoint}/members/${memberId}`;

		console.log(this.authService.getToken());
		return this.httpClient.get<ApiResponse<MemberDto>>(url, {
			headers: {
				Authorization: this.authService.getToken()
			}
		});
	}
}
