import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { ProgramService } from '../services/program.service';
import { PermissionsService } from '../services/permission.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { ProgramUserDto, Status, userRoleEnum, statusEnum } from '@org.quicko.cliq/ngx-core';
import { plainToInstance } from 'class-transformer';
import { ProgramSummaryViewWorkbook } from '@org-quicko/cliq-sheet-core/ProgramSummaryView/beans';

type ProgramsListStoreState = {
	programs: ProgramUserDto[];
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
								let superAdminPrograms: ProgramUserDto[] = [];

								if (summaryResponse.data) {
									const workbook = plainToInstance(ProgramSummaryViewWorkbook, summaryResponse.data);
									const sheet = workbook.getProgramSummaryViewSheet();
									const table = sheet.getProgramSummaryViewTable();
									const rows = table.getRows();
									
									for (let i = 0; i < rows.length; i++) {
										const row = table.getRow(i);
										superAdminPrograms.push({
											programId: row.getProgramId(),
											userId: '',
											name: row.getProgramName(),
											role: userRoleEnum.SUPER_ADMIN,
											status: statusEnum.ACTIVE,
											createdAt: new Date(),
											updatedAt: new Date()
										} as ProgramUserDto);
									}
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
							
								const programs: ProgramUserDto[] = (response.data || []).map((programUser: any) => ({
									programId: programUser.programId || programUser.program_id,
									userId: programUser.userId || programUser.user_id || '',
									name: programUser.name || programUser.program?.name || '',
									role: programUser.role,
									status: programUser.status || statusEnum.ACTIVE,
									createdAt: programUser.createdAt ? new Date(programUser.createdAt) : new Date(),
									updatedAt: programUser.updatedAt ? new Date(programUser.updatedAt) : new Date()
								} as ProgramUserDto));
								patchState(store, {
									programs: programs,
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
