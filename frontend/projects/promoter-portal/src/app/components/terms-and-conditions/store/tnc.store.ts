import { withDevtools } from "@angular-architects/ngrx-toolkit";
import { EventEmitter, inject } from "@angular/core";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { RegisterForProgramDto, SnackbarService, Status } from "@org.quicko.cliq/ngx-core";
import { PromoterService } from "../../../services/promoter.service";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, switchMap, tap } from "rxjs";
import { tapResponse } from "@ngrx/operators";

export interface TncState {
	status: Status;
	error: any;
}

const initialTncState: TncState = {
	status: Status.PENDING,
	error: null,
};

export const onRegisterForProgramSuccess: EventEmitter<boolean> = new EventEmitter();
export const onRegisterForProgramError: EventEmitter<string> = new EventEmitter();

export const TncStore = signalStore(
	withState(initialTncState),
	withDevtools('tnc'),
	withMethods((
		store,
		promoterService = inject(PromoterService),
		snackBarService = inject(SnackbarService),
	) => ({

		registerForProgram: rxMethod<{ programId: string, promoterId: string, registerForProgram: RegisterForProgramDto }>(
			pipe(
				tap(() => patchState(store, { status: Status.LOADING })),

				switchMap(({ programId, promoterId, registerForProgram }) => {
					return promoterService.registerForProgram(programId, promoterId, registerForProgram).pipe(
						tapResponse({
							next(response) {
								onRegisterForProgramSuccess.emit();
								patchState(store, { status: Status.SUCCESS, error: null });
							},
							error(error) {
								console.error(error);
								onRegisterForProgramError.emit();
								patchState(store, { status: Status.ERROR, error });
								snackBarService.openSnackBar('Failed to register for program', '');
							},
						})
					)
				})
			)
		),

	}))
)
