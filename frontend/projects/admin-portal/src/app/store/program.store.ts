import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { ProgramService } from '../services/program.service';
import { ProgramDto as Program, SnackbarService, Status, UpdateProgramDto } from '@org.quicko.cliq/ngx-core';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { plainToInstance } from 'class-transformer';
import { HttpErrorResponse } from '@angular/common/http';

export interface ProgramStoreState {
	program: Program | null,
	error: any | null,
	status: Status
};

export const initialProgramState: ProgramStoreState = {
	program: null,
	error: null,
	status: Status.PENDING
};

export const ProgramStore = signalStore(
	{ providedIn: 'root' },

	withState(initialProgramState),
	withDevtools('program'),
	withMethods(
		(
			store,
			programService = inject(ProgramService),
			snackbarService = inject(SnackbarService),
		) => ({
		setProgram: (program: Program) => {
			patchState(store, { program, status: Status.SUCCESS });
		},


		setStatus(status: Status, error: any = null) {
			if (status === Status.ERROR) {

				patchState(store, { status, error });
			}

			patchState(store, { status });
		},

		updateProgram: rxMethod<{ programId: string, body: UpdateProgramDto }>(pipe(
			tap(() => patchState(store, { status: Status.LOADING })),
			switchMap(({ programId, body }) =>
				programService.updateProgram(programId, body).pipe(
					tapResponse({
						next() {
							const currentProgram = store.program();
							if (currentProgram) {
								patchState(store, {
									program: plainToInstance(Program, { ...currentProgram, ...body }),
									status: Status.SUCCESS,
									error: null,
								});
							}
							snackbarService.openSnackBar('Program updated successfully', undefined);
						},
						error(error: HttpErrorResponse) {
							patchState(store, { status: Status.ERROR, error });
							snackbarService.openSnackBar('Failed to update program', undefined);
						},
					})
				)
			)
		)),

		deleteProgram: rxMethod<{ programId: string, onSuccess: () => void }>(pipe(
			tap(() => patchState(store, { status: Status.LOADING })),
			switchMap(({ programId, onSuccess }) =>
				programService.deleteProgram(programId).pipe(
					tapResponse({
						next() {
							patchState(store, { program: null, status: Status.SUCCESS, error: null });
							snackbarService.openSnackBar('Program deleted successfully', undefined);
							onSuccess();
						},
						error(error: HttpErrorResponse) {
							patchState(store, { status: Status.ERROR, error });
							snackbarService.openSnackBar('Failed to delete program', undefined);
						},
					})
				)
			)
		)),

	})),
);
