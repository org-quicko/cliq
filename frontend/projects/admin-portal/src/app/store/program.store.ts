import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { ProgramService } from '../services/program.service';
import { ProgramDto as Program, Status } from '@org.quicko.cliq/ngx-core';
import { withDevtools } from '@angular-architects/ngrx-toolkit';

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
			programService = inject(ProgramService)
		) => ({
		setProgram: (program: Program) => {
			patchState(store, { program, status: Status.SUCCESS });
		},


		setStatus(status: Status, error: any = null) {
			if (status === Status.ERROR) {

				patchState(store, { status, error });
			}

			patchState(store, { status });
		}

	})),
);
