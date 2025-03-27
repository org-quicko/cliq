import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { MemberDto } from '../../../../../../org-quicko-cliq-core/src/lib/dtos/member.dto';
import { MemberService } from '../../../services/member.service';
import { EventEmitter, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { firstValueFrom, pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { SnackbarService } from '@org.quicko/ngx-core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

export interface LogInState {
	member: MemberDto | null;
}

const initialLogInState: LogInState = {
	member: null,
};

export const onSignInSuccess: EventEmitter<boolean> = new EventEmitter();
export const onSignInError: EventEmitter<string> = new EventEmitter();

export const LogInStore = signalStore(
	withState(initialLogInState),

	withMethods(
		(
			store,
			memberService = inject(MemberService),
			authService = inject(AuthService),
		) => ({

			logIn: rxMethod<MemberDto>(
				pipe(
					switchMap((member) => {
						return memberService.logIn(member).pipe(
							tapResponse({
								next: (response) => {
									console.log('here');
									authService.setToken(response.data!.access_token);
									onSignInSuccess.emit(true);
								},
								error: (err) => {
									if (err instanceof Error) {
										onSignInError.emit(err.message || 'Login failed');
									}
								}
							})
						);
					})
				)
			)

		})
	),
);

