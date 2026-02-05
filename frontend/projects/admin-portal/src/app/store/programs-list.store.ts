import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { ProgramService } from '../services/program.service';
import { ProgramDto, Status } from '@org.quicko.cliq/ngx-core';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';

export interface ProgramWithRole extends ProgramDto {
	role?: string;
}

export interface ProgramsListStoreState {
	programs: ProgramWithRole[];
	error: any | null;
	status: Status;
	isSuperAdmin: boolean;
}

export const initialProgramsListState: ProgramsListStoreState = {
	programs: [],
	error: null,
	status: Status.PENDING,
	isSuperAdmin: false
};

export const ProgramsListStore = signalStore(
	{ providedIn: 'root' },

	withState(initialProgramsListState),
	withDevtools('programs-list'),
	withMethods(
		(
			store,
			programService = inject(ProgramService)
		) => ({
			fetchPrograms: rxMethod<void>(
				pipe(
					tap(() => {
						console.log('[ProgramsListStore] Fetching programs...');
						patchState(store, { status: Status.PENDING });
					}),

					switchMap(() => programService.getProgramSummary({ take: 100 }).pipe(
						switchMap((summaryResponse) => {
							let superAdminPrograms: ProgramWithRole[] = [];
							
							if (summaryResponse.data) {
								const workbook = summaryResponse.data;
								const sheet = workbook?.sheets?.[0];
								const table = sheet?.blocks?.[0];
								const rows = table?.rows || [];
								
						
								superAdminPrograms = rows.map((row: any[]) => ({
									programId: row[0],
									name: row[1],
									role: 'super_admin'
								} as ProgramWithRole));
							}
							
						
							patchState(store, { 
								programs: superAdminPrograms,
								status: Status.SUCCESS,
								isSuperAdmin: true
							});
							return of(null);
						}),
						catchError((error) => {
							
			
							return programService.getAllPrograms().pipe(
								tap((response) => {
									const programs = response.data || [];
									patchState(store, { 
										programs,
										status: Status.SUCCESS,
										isSuperAdmin: false
									});
								}),
								catchError((innerError) => {
									console.error('[ProgramsListStore] Error fetching regular programs:', innerError);
									patchState(store, { 
										error: innerError, 
										status: Status.ERROR,
										programs: []
									});
									return of(null);
								})
							);
						})
					)),
					catchError((error) => {
						console.error('[ProgramsListStore] Error fetching programs:', error);
						patchState(store, { 
							error, 
							status: Status.ERROR,
							programs: []
						});
						return of(null);
					})
				)
			),

			resetStore() {
				patchState(store, initialProgramsListState);
			}
		})
	)
);
