import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { ProgramService } from '../services/program.service';
import { ProgramDto, Status } from '@org.quicko.cliq/ngx-core';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { pipe, switchMap, tap } from 'rxjs';

export interface ProgramWithRole extends ProgramDto {
	role?: string;
}

export interface ProgramsListStoreState {
	programs: ProgramWithRole[];
	error: any | null;
	status: Status;
}

export const initialProgramsListState: ProgramsListStoreState = {
	programs: [],
	error: null,
	status: Status.PENDING
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
					switchMap(() => programService.getAllPrograms()),
					tap({
						next: (response) => {
							console.log('[ProgramsListStore] Programs fetched successfully:', response);
						console.log('[ProgramsListStore] Number of programs:', response.data?.length || 0);
						console.log('[ProgramsListStore] Raw program data:', response.data);
						// Use data as-is from backend - don't remap
						const programs = response.data || [];
						patchState(store, { 
							programs,
							status: Status.SUCCESS 
						});
						},
						error: (error) => {
							console.error('[ProgramsListStore] Error fetching programs:', error);
							console.error('[ProgramsListStore] Error details:', error.error);
							patchState(store, { 
								error, 
								status: Status.ERROR,
								programs: []
							});
						}
					})
				)
			),

			resetStore() {
				patchState(store, initialProgramsListState);
			}
		})
	)
);
