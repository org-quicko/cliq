import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { EventEmitter, inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto, SnackbarService, Status, UpdateProgramUserDto, UpdateUserDto, UserDto } from '@org.quicko.cliq/ngx-core';
import { ProgramService } from '../../../../../services/program.service';
import { UserService } from '../../../../../services/user.service';

export interface TeamStoreState {
	users: UserDto[];
	error: any;
	status: Status;
}

export const initialTeamState: TeamStoreState = {
	users: [],
	error: null,
	status: Status.PENDING,
};

export const onAddUserSuccess: EventEmitter<void> = new EventEmitter();
export const onRemoveUserSuccess: EventEmitter<void> = new EventEmitter();

export const TeamStore = signalStore(
	withState(initialTeamState),
	withDevtools('team'),
	withMethods(
		(
			store,
			programService = inject(ProgramService),
			userService = inject(UserService),
			snackBarService = inject(SnackbarService),
		) => ({

			fetchUsers: rxMethod<{ programId: string, skip?: number, take?: number }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),
					switchMap(({ programId, skip, take }) =>
						programService.getProgramUsers(programId, skip, take).pipe(
							tapResponse({
								next(response) {
									const users = plainToInstance(UserDto, response.data as object[]);
									patchState(store, { users, status: Status.SUCCESS, error: null });
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar('Failed to fetch users', '');
								},
							})
						)
					)
				)
			),

			inviteUser: rxMethod<{ programId: string, body: CreateUserDto }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),
					switchMap(({ programId, body }) =>
						programService.inviteUser(programId, body).pipe(
							tapResponse({
								next() {
									patchState(store, { status: Status.SUCCESS, error: null });
									onAddUserSuccess.emit();
									snackBarService.openSnackBar('Successfully added user!', '');
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar(error?.error?.message || 'Failed to add user', '');
								},
							})
						)
					)
				)
			),

			updateUserRole: rxMethod<{ programId: string, userId: string, body: UpdateProgramUserDto }>(
				pipe(
					switchMap(({ programId, userId, body }) =>
						programService.updateUserRole(programId, userId, body).pipe(
							tapResponse({
								next() {
									const currentUsers = store.users();
									if (currentUsers) {
										const updatedUsers = currentUsers.map(user => {
											if (user.userId === userId) {
												return { ...user, role: body.role };
											}
											return user;
										});
										patchState(store, { users: updatedUsers, status: Status.SUCCESS, error: null });
									}
									snackBarService.openSnackBar(`Changed user role to ${body.role}`, '');
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar('Failed to update user role', '');
								},
							})
						)
					)
				)
			),

			updateUserInfo: rxMethod<{ userId: string, body: UpdateUserDto }>(
				pipe(
					switchMap(({ userId, body }) =>
						userService.updateUser(userId, body).pipe(
							tapResponse({
								next() {
									const currentUsers = store.users();
									if (currentUsers) {
										const updatedUsers = currentUsers.map(user => {
											if (user.userId === userId) {
												return {
													...user,
													email: body.email ?? user.email,
													firstName: body.firstName ?? user.firstName,
													lastName: body.lastName ?? user.lastName
												};
											}
											return user;
										});
										patchState(store, { users: updatedUsers, status: Status.SUCCESS, error: null });
									}
									snackBarService.openSnackBar('Updated User info', '');
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar('Failed to update user info', '');
								},
							})
						)
					)
				)
			),

			removeUser: rxMethod<{ programId: string, userId: string }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),
					switchMap(({ programId, userId }) =>
						programService.removeUser(programId, userId).pipe(
							tapResponse({
								next() {
									patchState(store, { status: Status.SUCCESS, error: null });
									onRemoveUserSuccess.emit();
									snackBarService.openSnackBar('Successfully removed user!', '');
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar('Failed to remove user', '');
								},
							})
						)
					)
				)
			),

			setStatus(status: Status, error: any = null) {
				if (status === Status.ERROR) {
					if (!error) {
						throw new Error('Must pass error object on an error status state.');
					}
					patchState(store, { status, error });
				}
				patchState(store, { status });
			},
		})
	)
);
