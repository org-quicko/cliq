import { Injectable, inject } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { plainToInstance } from 'class-transformer';
import { PromoterStore } from '../store/promoter.store';
import { MemberService } from '../services/member.service';
import { PromoterDto, PromoterMemberDto } from '@org.quicko.cliq/ngx-core';
import { MemberStore } from '../store/member.store';
import { SnackbarService } from '@org.quicko/ngx-core';

@Injectable({ providedIn: 'root' })
export class PromoterResolver implements Resolve<PromoterDto> {
	constructor() { }

	readonly memberStore = inject(MemberStore);
	readonly promoterStore = inject(PromoterStore);
	readonly memberService = inject(MemberService);
	readonly snackBarService = inject(SnackbarService);

	resolve(): Observable<PromoterDto> {
		return this.memberService.getPromoterOfMember().pipe(
			tap((response) => {
				if (response.data) {
					const promoter = plainToInstance(PromoterDto, response.data);
					this.promoterStore.setPromoter(promoter);
				}
			}),
			map((response) => plainToInstance(PromoterDto, response.data?.promoter) ?? new PromoterDto()),
			catchError((error) => {
				this.snackBarService.openSnackBar('Failed to get member role', '');
				return of(new PromoterDto());
			})
		);
	}
}
