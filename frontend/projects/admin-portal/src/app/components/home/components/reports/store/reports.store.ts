import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { SnackbarService, Status, reportPeriodEnum } from '@org.quicko.cliq/ngx-core';
import { ProgramService } from '../../../../../services/program.service';
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
    withDevtools('admin-report'),
    withMethods(
        (
            store,
            programService = inject(ProgramService),
            snackbarService = inject(SnackbarService),
        ) => ({

            getCommissionsReport: rxMethod<{
                reportPeriod?: reportPeriodEnum,
                startDate?: Date,
                endDate?: Date,
                programId: string,
            }>(
                pipe(
                    tap(() => patchState(store, { status: Status.LOADING })),

                    switchMap(({ reportPeriod, startDate, endDate, programId }) => {
                        return programService.getCommissionsReport(
                            programId,
                            startDate?.toISOString(),
                            endDate?.toISOString()
                        ).pipe(
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
                                    snackbarService.openSnackBar('Successfully downloaded commissions report', '');
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