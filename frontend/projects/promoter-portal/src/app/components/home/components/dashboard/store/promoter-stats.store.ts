import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { plainToInstance } from 'class-transformer';
import { PromoterService } from '../../../../../services/promoter.service';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { Status, SnackbarService } from '@org.quicko.cliq/ngx-core';
import { PromoterStatsTable, PromoterWorkbook } from '@org.quicko.cliq/ngx-core/generated/sources/Promoter';
import { HttpErrorResponse } from '@angular/common/http';

export interface PromoterStatsStoreState {
	statistics: PromoterStatsTable | null,
	error: any | null,
	status: Status,
};

export const initialPromoterStatsState: PromoterStatsStoreState = {
	statistics: null,
	error: null,
	status: Status.PENDING,
};

export const PromoterStatsStore = signalStore(
	withState(initialPromoterStatsState),
	withDevtools('promoter-stats'),
	withMethods(
		(
			store,
			promoterService = inject(PromoterService),
			snackbarService = inject(SnackbarService),
		) => ({

			getPromoterStats: rxMethod<void>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(() => {
						return promoterService.getPromoterStatistics().pipe(
							tapResponse({
								next: (response) => {
									patchState(store, {
										statistics: plainToInstance(PromoterWorkbook, response.data).getPromoterStatsSheet().getPromoterStatsTable(),
										status: Status.SUCCESS
									});
								},
								error: (error: HttpErrorResponse) => {
									if (error.status == 404) {
										console.error('No statistics found for this promoter');
									} else {
										patchState(store, { status: Status.ERROR, error });
										snackbarService.openSnackBar('Error trying to fetch promoter statistics', '');
									}
								}
							})
						)
					})
				)
			)

		})
	)
);
