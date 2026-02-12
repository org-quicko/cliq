import { inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { pipe, switchMap, tap } from 'rxjs';
import { UserService } from '../services/user.service';
import { Status, UserDto, userRoleEnum } from '@org.quicko.cliq/ngx-core';
import { plainToInstance } from 'class-transformer';
import { computed } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { PermissionsService } from '../services/permission.service';

export interface UserStoreState {
	user: UserDto | null;
	isLoading: boolean;
	error: string | null;
}

export const initialUserState: UserStoreState = {
	user: null,
	isLoading: false,
	error: null,
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
			permissionsService = inject(PermissionsService)
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
									console.error('[UserStore] Error fetching user:', error);
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
		})
	)
);
