import { inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { pipe, switchMap, tap } from 'rxjs';
import { UserService } from '../services/user.service';
import { SnackbarService, Status, UserDto, UpdateUserDto, userRoleEnum } from '@org.quicko.cliq/ngx-core';
import { plainToInstance } from 'class-transformer';
import { computed } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { PermissionsService } from '../services/permission.service';
import { HttpErrorResponse } from '@angular/common/http';

export interface UserStoreState {
	user: UserDto | null;
	isLoading: boolean;
	error: HttpErrorResponse | null;
	status: Status;
}

export const initialUserState: UserStoreState = {
	user: null,
	isLoading: false,
	error: null,
	status: Status.PENDING,
};

export const UserStore = signalStore(
	{ providedIn: 'root' },

	withState(initialUserState),
	withDevtools('user'),

	withComputed((store) => ({
		isSuperAdmin: computed(() => store.user()?.role === userRoleEnum.SUPER_ADMIN),
		userRole: computed(() => store.user()?.role ?? null),
	})),

	withMethods(
		(
			store,
			userService = inject(UserService),
			permissionsService = inject(PermissionsService),
			snackbarService = inject(SnackbarService),
		) => ({
			fetchUser: rxMethod<{ userId: string }>(
				pipe(
					tap(() => {
						patchState(store, { isLoading: true });
					}),
					switchMap(({ userId }) =>
						userService.getUser(userId).pipe(
							tapResponse({
								next: (response) => {
									if (response.data) {
										const user = plainToInstance(UserDto, response.data);
										patchState(store, {
											user,
											isLoading: false,
											error: null,
										});
							
										if (user.role) {
											permissionsService.setUserRole(user.role);
										}
									}
								},
								error: (error: any) => {
									snackbarService.openSnackBar('Failed to fetch user data', 'Close');
									patchState(store, {
										isLoading: false,
										error: error.message,
									});
								},
							})
						)
					)
				)
			),

			setUser(user: UserDto) {
				patchState(store, { user, isLoading: false });
			},

			clearUser() {
				patchState(store, initialUserState);
			},

			updateUserInfo: rxMethod<{ updatedInfo: UpdateUserDto, userId: string }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),
					switchMap(({ updatedInfo, userId }) =>
						userService.updateUser(userId, updatedInfo).pipe(
							tapResponse({
								next(response) {
									const userDto = plainToInstance(UserDto, response.data);
									patchState(store, { status: Status.SUCCESS, user: userDto, error: null });
									snackbarService.openSnackBar('Successfully updated your info!', '');
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackbarService.openSnackBar(error.error.message, '');
								},
							})
						)
					)
				)
			),

			resetError() {
				patchState(store, { error: null });
			},
		})
	)
);
