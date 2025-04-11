import { Injectable, inject } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { plainToInstance } from 'class-transformer';
import { PromoterStore } from '../store/promoter.store';
import { MemberService } from '../services/member.service';
import { PromoterDto, Status } from '@org.quicko.cliq/ngx-core';
import { SnackbarService } from '@org.quicko/ngx-core';
import { ProgramStore } from '../store/program.store';

@Injectable({ providedIn: 'root' })
export class PromoterResolver implements Resolve<PromoterDto> {
	constructor() { }

	readonly promoterStore = inject(PromoterStore);
	readonly programStore = inject(ProgramStore);
	readonly memberService = inject(MemberService);
	readonly snackBarService = inject(SnackbarService);

	resolve(): Observable<PromoterDto> {
		const programId = this.programStore.program()!.programId;

		return this.memberService.getPromoterOfMember(programId).pipe(
			tap((response) => {
				if (response.data) {
					const promoter = plainToInstance(PromoterDto, response.data);
					this.promoterStore.setPromoter(promoter);
				}
			}),
			map((response) => plainToInstance(PromoterDto, response.data) ?? new PromoterDto()),
			catchError((error) => {
				this.snackBarService.openSnackBar('Failed to get promoter', '');
				this.promoterStore.setStatus(Status.ERROR, error);
				return of(new PromoterDto());
			})
		);
	}
}
