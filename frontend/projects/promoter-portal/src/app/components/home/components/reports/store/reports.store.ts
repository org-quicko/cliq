import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { SnackbarService, Status } from '@org.quicko.cliq/ngx-core';
import { PromoterService } from '../../../../../services/promoter.service';

export interface ReportsStoreState {
	error: any | null,
	status: Status,
};

export const initialReportState: ReportsStoreState = {
	error: null,
	status: Status.PENDING,
};

export const ReportsStore = signalStore(
	withState(initialReportState),

	withMethods(
		(
			store,
			promoterService = inject(PromoterService),
			snackbarService = inject(SnackbarService),
		) => ({

			getReport: rxMethod<void>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(() => {
						return promoterService.getReport().pipe(
							tapResponse({
								next: ({ blob, fileName }) => {
									const a = document.createElement('a');
									const objectUrl = URL.createObjectURL(blob);
									a.href = objectUrl;
									a.download = fileName;
									document.body.appendChild(a);
									a.click();
									URL.revokeObjectURL(objectUrl);
									document.body.removeChild(a);

									patchState(store, { status: Status.SUCCESS });
								},
								error: (error) => {
									if (error instanceof Error) {
										patchState(store, { status: Status.ERROR });
										snackbarService.openSnackBar(error.message, '');
									}
								},
							})
						)
					}),

				)
			),

		})
	),
);
