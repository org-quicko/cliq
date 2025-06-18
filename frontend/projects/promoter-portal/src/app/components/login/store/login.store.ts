import { signalStore, withMethods, withState } from '@ngrx/signals';
import { MemberDto, SnackbarService } from '@org.quicko.cliq/ngx-core';
import { MemberService } from '../../../services/member.service';
import { EventEmitter, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Status } from '@org.quicko.cliq/ngx-core';
import { PromoterService } from '../../../services/promoter.service';

export interface LogInState {
	member: MemberDto | null;
	status: Status;
	error: any;
}

const initialLogInState: LogInState = {
	member: null,
	status: Status.PENDING,
	error: null,
};

export const onSignInSuccess: EventEmitter<boolean> = new EventEmitter();
export const onSignInError: EventEmitter<string> = new EventEmitter();

export const LogInStore = signalStore(
	withState(initialLogInState),

	withMethods(
		(
			store,
			memberService = inject(MemberService),
			promoterService = inject(PromoterService),
			authService = inject(AuthService),
			snackBarService = inject(SnackbarService)
		) => ({

			logIn: rxMethod<{ member: MemberDto, programId: string, }>(
				pipe(
					switchMap(({ member, programId }) => {
						return memberService.logIn(programId, member).pipe(
							tapResponse({
								next: (response) => {
									authService.setToken(response.data!.access_token);
									onSignInSuccess.emit(true);
								},
								error: (error: HttpErrorResponse) => {
									console.error(error.error.message);
									snackBarService.openSnackBar(error.error.message, '');
								}
							})
						);
					})
				)
			),

		})
	),
);

