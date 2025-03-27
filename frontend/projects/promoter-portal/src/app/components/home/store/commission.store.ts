import { inject } from "@angular/core";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { PromoterService } from "../../../services/promoter.service";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, switchMap, tap } from "rxjs";
import { tapResponse } from "@ngrx/operators";
import { plainToInstance } from "class-transformer";
import { CommissionTable, PromoterWorkbook, SnackbarService, Status } from "@org.quicko.cliq/ngx-core";

export interface CommissionStoreState {
	commissions: CommissionTable | null,
	error: any | null,
	status: Status
};

export const initialCommissionState: CommissionStoreState = {
	commissions: null,
	error: null,
	status: Status.PENDING
};

export const CommissionStore = signalStore(
	withState(initialCommissionState),
	withMethods(
		(
			store,
			promoterService = inject(PromoterService),
			snackBarService = inject(SnackbarService)
		) => ({
			getPromoterCommissions: rxMethod<void>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(() => {
						return promoterService.getPromoterCommissions().pipe(
							tapResponse({
								next: (response) => {
									patchState(store, {
										commissions: plainToInstance(PromoterWorkbook, response.data).getCommissionSheet().getCommissionTable(),
										status: Status.SUCCESS
									})
								},
								error: (err) => {
									patchState(store, { status: Status.ERROR });
									snackBarService.openSnackBar('Failed to load commissions', '');
								}
							})
						)
					})
				)
			)
		})
	),

)
