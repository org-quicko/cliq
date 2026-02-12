import { signalStore, withMethods, withState } from '@ngrx/signals';
import { LoginDto, SnackbarService, userRoleEnum } from '@org.quicko.cliq/ngx-core';
import { UserService } from '../../../services/user.service';
import { EventEmitter, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Status } from '@org.quicko.cliq/ngx-core';
import { PermissionsService } from '../../../services/permission.service';

export interface LogInState {
	admin: LoginDto | null;
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
			userService = inject(UserService),
			authService = inject(AuthService),
			permissionsService = inject(PermissionsService),
			snackBarService = inject(SnackbarService)
		) => ({

			logIn: rxMethod<{ admin: LoginDto }>(
				pipe(
					switchMap(({ admin }) => {
						return userService.logIn(admin).pipe(
							tapResponse({
								next: (response) => {
									authService.setToken(response.data!.access_token);
									
									// Get user role from JWT token and set permissions
									const userRole = authService.getUserRole();
									if (userRole) {
										permissionsService.setUserRole(userRole);
									}
									
									onSignInSuccess.emit(true);
								},
								error: (error: HttpErrorResponse) => {
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
