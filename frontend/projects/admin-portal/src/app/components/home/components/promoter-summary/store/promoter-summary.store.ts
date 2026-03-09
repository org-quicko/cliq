import { inject, computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { plainToInstance } from 'class-transformer';

import { ProgramService } from '../../../../../services/program.service';
import { Status, SnackbarService } from '@org.quicko.cliq/ngx-core';

import {
    PromoterWorkbook,
    PromoterAnalyticsRow,
    DateWisePromoterAnalyticsRow
} from '@org-quicko/cliq-sheet-core/Promoter/beans';


export interface PromoterSummaryStoreState {
    promoterName: string;

    analytics: {
        summaryRow: PromoterAnalyticsRow | null;
        dailyRows: DateWisePromoterAnalyticsRow[];

        dataType: string | null;
        period: string | null;
        startDate: string | null;
        endDate: string | null;

        error: any | null;
        status: Status;
    };
}

const initialState: PromoterSummaryStoreState = {
    promoterName: '',
    analytics: {
        summaryRow: null,
        dailyRows: [],
        dataType: 'daily',
        period: '30days',
        startDate: null,
        endDate: null,
        error: null,
        status: Status.PENDING,
    },
};

export const PromoterSummaryStore = signalStore(
    withState(initialState),

    withDevtools('promoter-summary'),

    withComputed((store) => ({
        isLoading: computed(() => store.analytics().status === Status.LOADING),
    })),

    withMethods(
        (
            store,
            programService = inject(ProgramService),
            snackbarService = inject(SnackbarService),
        ) => ({

            getPromoterSummaryAnalytics: rxMethod<{
                programId: string;
                promoterId: string;
                period?: string;
                startDate?: string;
                endDate?: string;
            }>(
                pipe(

                    tap(() => {
                        patchState(store, {
                            analytics: {
                                ...store.analytics(),
                                status: Status.LOADING,
                                error: null,
                            },
                        });
                    }),

                    switchMap(({ programId, promoterId, period, startDate, endDate }) =>
                        programService
                            .getPromoterSummaryAnalytics(programId, promoterId, period, startDate, endDate)
                            .pipe(

                                tapResponse({

                                    next: (response) => {
                                        try {

                                            const workbook = plainToInstance(
                                                PromoterWorkbook,
                                                response?.data
                                            );
                                            const sheet = workbook.getPromoterAnalyticsSheet();
                                            const table = sheet.getPromoterAnalyticsTable();

                                            const metadata = workbook.getMetadata();

                                            let summaryRow: PromoterAnalyticsRow | null = null;

                                            summaryRow = table.getRow(0);

                                            const dateWiseTable = sheet.getDateWisePromoterAnalyticsTable();
                                            const dailyRows: DateWisePromoterAnalyticsRow[] = [];

                                            const length = dateWiseTable.getRows()?.length ?? 0;

                                            for (let i = 0; i < length; i++) {
                                                dailyRows.push(dateWiseTable.getRow(i));
                                            }

                                            patchState(store, {
                                                promoterName: summaryRow?.getPromoterName() ?? '',

                                                analytics: {
                                                    summaryRow,
                                                    dailyRows,
                                                    dataType: (metadata?.get('dataType') as string) || 'daily',
                                                    period: (metadata?.get('period') as string) || period || '30days',
                                                    startDate: (metadata?.get('startDate') as string) || null,
                                                    endDate: (metadata?.get('endDate') as string) || null,

                                                    error: null,
                                                    status: Status.SUCCESS,
                                                },
                                            });

                                        } catch (error) {
                                            patchState(store, {
                                                analytics: {
                                                    summaryRow: null,
                                                    dailyRows: [],
                                                    dataType: 'daily',
                                                    period: period || '30days',
                                                    startDate: null,
                                                    endDate: null,
                                                    error,
                                                    status: Status.ERROR,
                                                },
                                            });

                                            snackbarService.openSnackBar(
                                                'Error parsing promoter analytics data',
                                                ''
                                            );

                                        }
                                    },

                                    error: (error: HttpErrorResponse) => {

                                        if (error.status === 404) {

                                            patchState(store, {
                                                analytics: {
                                                    summaryRow: null,
                                                    dailyRows: [],
                                                    dataType: 'daily',
                                                    period: period || '30days',
                                                    startDate: null,
                                                    endDate: null,
                                                    error: null,
                                                    status: Status.SUCCESS,
                                                },
                                            });

                                            return;
                                        }

                                        patchState(store, {
                                            analytics: {
                                                summaryRow: null,
                                                dailyRows: [],
                                                dataType: 'daily',
                                                period: period || '30days',
                                                startDate: null,
                                                endDate: null,
                                                error,
                                                status: Status.ERROR,
                                            },
                                        });

                                        snackbarService.openSnackBar(
                                            'Error fetching promoter analytics',
                                            ''
                                        );
                                    },

                                })
                            )
                    )
                )
            ),
        })
    ),
);