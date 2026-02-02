import { signalStore, withMethods, withState } from '@ngrx/signals';
import { MemberDto, SnackbarService } from '@org.quicko.cliq/ngx-core';
import { AdminService } from '../../../services/admin.service';
import { EventEmitter, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Status } from '@org.quicko.cliq/ngx-core';

export interface LogInState {
	admin: MemberDto | null;
	status: Status;
	error: any;
}

const initialLogInState: LogInState = {
	admin: null,
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
			adminService = inject(AdminService),
			authService = inject(AuthService),
			snackBarService = inject(SnackbarService)
		) => ({

			logIn: rxMethod<{ admin: MemberDto }>(
				pipe(
					switchMap(({ admin }) => {
						return adminService.logIn(admin).pipe(
							tapResponse({
								next: (response) => {
									authService.setToken(response.data!.access_token);
									onSignInSuccess.emit(true);
								},
								error: (error: HttpErrorResponse) => {
									console.error(error.error.message);
									onSignInError.emit(error.error.message);
								}
							})
						);
					})
				)
			),

		})
	),
);
