import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { ProgramService } from '../services/program.service';
import { PermissionsService } from '../services/permission.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { ProgramDto, Status, userRoleEnum } from '@org.quicko.cliq/ngx-core';

export interface ProgramWithRole extends ProgramDto {
	role?: userRoleEnum | string;
}

type ProgramsListStoreState = {
	programs: ProgramWithRole[];
	status: Status;
	isSuperAdmin: boolean;
	error: string | null;
};

const initialState: ProgramsListStoreState = {
	programs: [],
	status: Status.PENDING,
	isSuperAdmin: false,
	error: null,
};

export const ProgramsListStore = signalStore(
	{ providedIn: 'root' },
	withDevtools('programs_list'),
	withState(initialState),

	withMethods((store, programService = inject(ProgramService), permissionsService = inject(PermissionsService)) => ({
		fetchPrograms: rxMethod<void>(
			pipe(
				tap(() => {
					patchState(store, {
						status: Status.PENDING,
					});
				}),
				switchMap(() => {

					if (permissionsService.isSuperAdmin()) {

						return programService.getProgramSummary().pipe(
							tap((summaryResponse) => {
								let superAdminPrograms: ProgramWithRole[] = [];

								if (summaryResponse.data) {
									const workbook = summaryResponse.data;
									const sheet = workbook?.sheets?.[0];
									const table = sheet?.blocks?.[0];
									const rows = table?.rows || [];

									superAdminPrograms = rows.map((row: any[]) =>
										({
											programId: row[0],
											name: row[1],
											role: userRoleEnum.SUPER_ADMIN,
										}) as ProgramWithRole
									);
								}

								patchState(store, {
									programs: superAdminPrograms,
									status: Status.SUCCESS,
									isSuperAdmin: true,
								});
							}),
							catchError((error) => {
								patchState(store, {
									error: error.message,
									status: Status.ERROR,
									programs: [],
								});
								return of(null);
							})
						);
					} else {
		
						return programService.getAllPrograms().pipe(
							tap((response) => {
							
								const programsWithRole: ProgramWithRole[] = (response.data || []).map((programUser: any) => ({
									programId: programUser.programId || programUser.program_id,
									name: programUser.program?.name || programUser.program?.name,
									role: programUser.role || null,
									...(programUser.program || {}),
								}));
								patchState(store, {
									programs: programsWithRole,
									status: Status.SUCCESS,
									isSuperAdmin: false,
								});
							}),
							catchError((error) => {

								patchState(store, {
									error: error.message,
									status: Status.ERROR,
									programs: [],
								});
								return of(null);
							})
						);
					}
				}),
				catchError((error) => {
					patchState(store, {
						error: error.message,
						status: Status.ERROR,
						programs: [],
					});
					return of(null);
				})
			)
		),

		resetStore() {
			patchState(store, initialState);
		},
	}))
);
