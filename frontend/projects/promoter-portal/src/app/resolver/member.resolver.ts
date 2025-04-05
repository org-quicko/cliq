import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MemberDto as Member, MemberDto } from '../../../../org-quicko-cliq-core/src/lib/dtos/member.dto';
import { MemberStore } from '../store/member.store';
import { MemberService } from '../services/member.service';
import { plainToInstance } from 'class-transformer';

@Injectable({ providedIn: 'root' })
export class MemberResolver implements Resolve<Member> {
	constructor() { }

	readonly store = inject(MemberStore);

	readonly memberService = inject(MemberService);

	async resolve() {

		const response = await firstValueFrom(this.memberService.getMember());

		if (!response.data) {
			throw new Error('Member not found');
		}

		this.store.setMember(plainToInstance(MemberDto, response.data)); // set the global store
		return response.data;

	}
}
