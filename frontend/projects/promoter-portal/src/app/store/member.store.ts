import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { MemberDto, Status, UpdateMemberDto } from '@org.quicko.cliq/ngx-core';
import { MemberService } from '../services/member.service';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { PromoterService } from '../services/promoter.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { plainToInstance } from 'class-transformer';
import { SnackbarService } from '@org.quicko/ngx-core';

export interface MemberStoreState {
	member: MemberDto | null,
	error: HttpErrorResponse | null,
	status: Status
};

export const initialMemberState: MemberStoreState = {
	member: null,
	error: null,
	status: Status.PENDING
};

export const MemberStore = signalStore(
	{ providedIn: 'root' },
	withDevtools('member'),

	withState(initialMemberState),
	withMethods(
		(
			store,
			memberService = inject(MemberService),
			promoterService = inject(PromoterService),
			snackBarService = inject(SnackbarService),
		) => ({

			setMember(member: MemberDto) {
				patchState(store, { member, status: Status.SUCCESS });
			},

			setStatus(status: Status, error: any = null) {
				if (status === Status.ERROR) {
					if (!error) {
						console.error('Must pass error object on an error status state.');
						throw new Error('Must pass error object on an error status state.');
					}

					patchState(store, { status, error });
				}

				patchState(store, { status });
			},

			updateMemberInfo: rxMethod<UpdateMemberDto>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap((updatedInfo) => {
						return memberService.updateMemberInfo(updatedInfo).pipe(
							tapResponse({
								next(response) {
									const memberDto = plainToInstance(MemberDto, response.data);
									patchState(store, { status: Status.SUCCESS, member: memberDto, error: null });
									snackBarService.openSnackBar('Successfully updated your info!', '');
								},
								error(error: HttpErrorResponse) {
									console.log(error.error.message);
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar(error.error.message, '');
								},
							})
						)
					})
				)
			),

			leavePromoter: rxMethod<void>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(() => {
						return memberService.leavePromoter().pipe(
							tapResponse({
								next(response) {
									snackBarService.openSnackBar('Successfully left the promoter!', '');
								},
								error(error: HttpErrorResponse) {
									console.error(error.message);
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar('Failed to leave the promoter', '');
								},
							})
						)
					})
				)
			),

			resetError() {
				patchState(store, { error: null });
			}

	}))
);
