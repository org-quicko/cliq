import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { reportEnum, reportPeriodEnum, SnackbarService, Status } from '@org.quicko.cliq/ngx-core';
import { PromoterService } from '../../../../../services/promoter.service';
import { withDevtools } from '@angular-architects/ngrx-toolkit';

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
	withDevtools('report'),
	withMethods(
		(
			store,
			promoterService = inject(PromoterService),
			snackbarService = inject(SnackbarService),
		) => ({

			getReport: rxMethod<{ report: reportEnum, reportPeriod?: reportPeriodEnum, startDate?: Date, endDate?: Date }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(({ report, reportPeriod, startDate, endDate }) => {
						return promoterService.getReport(
							report, {
								report_period: reportPeriod,
								start_date: startDate?.toISOString(),
								end_date: endDate?.toISOString()
							}).pipe(
							tapResponse({
								next: ({ blob, fileName }) => {

									console.log(fileName, blob);

									const a = document.createElement('a');
									const objectUrl = URL.createObjectURL(blob);
									a.href = objectUrl;
									a.download = fileName;
									document.body.appendChild(a);
									a.click();
									URL.revokeObjectURL(objectUrl);
									document.body.removeChild(a);

									patchState(store, { status: Status.SUCCESS });
									snackbarService.openSnackBar(`Successfully downloaded ${report} report`, '');
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

			resetStatus() {
				patchState(store, { status: Status.PENDING });
			}

		})
	),
);
