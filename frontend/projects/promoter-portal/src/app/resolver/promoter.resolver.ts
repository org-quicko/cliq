import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Status } from '../../../../org-quicko-cliq-core/src/lib/enums/stateStatus.enum';
import { plainToInstance } from 'class-transformer';
import { PromoterDto as Promoter } from '../../../../org-quicko-cliq-core/src/lib/dtos';
import { PromoterStore } from '../store/promoter.store';
import { MemberService } from '../services/member.service';


@Injectable({ providedIn: 'root' })
export class PromoterResolver implements Resolve<Promoter> {
	constructor() { }

	readonly store = inject(PromoterStore);

	readonly memberService = inject(MemberService);

	async resolve(route: ActivatedRouteSnapshot) {
		this.store.setStatus(Status.LOADING);

		const response = await firstValueFrom(this.memberService.getPromoterOfMember());

		if (!response.data) {
			this.store.setStatus(Status.ERROR);
			throw new Error('Promoter not found.');
		}

		this.store.setPromoter(plainToInstance(Promoter, response.data)); // set the global store
		return response.data;
	}

}
