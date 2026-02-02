import { inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Status, SnackbarService } from '@org.quicko.cliq/ngx-core';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { HttpErrorResponse } from '@angular/common/http';
import { ProgramService } from '../../../../../services/program.service';
import { computed } from '@angular/core';

export interface DailyData {
    date: string;
    signups: number;
    purchases: number;
    revenue: number;
    commission: number;
}

export interface DayWiseAnalyticsState {
    dailyData: DailyData[];
    period: string | null;
    dataType: string | null;
    startDate: string | null;
    endDate: string | null;
    error: any | null;
    status: Status;
}

export const initialDayWiseAnalyticsState: DayWiseAnalyticsState = {
    dailyData: [],
    period: '30days',
    dataType: 'daily',
    startDate: null,
    endDate: null,
    error: null,
    status: Status.PENDING,
};

export const DayWiseAnalyticsStore = signalStore(
    withState(initialDayWiseAnalyticsState),
    withDevtools('day-wise-analytics'),
    withComputed((store) => ({
        isLoading: computed(() => store.status() === Status.LOADING),
        hasData: computed(() => store.dailyData().length > 0),
    })),
    withMethods(
        (
            store,
            programService = inject(ProgramService),
            snackbarService = inject(SnackbarService),
        ) => ({
            fetchDayWiseAnalytics: rxMethod<{
                programId: string;
                period?: string;
                startDate?: string;
                endDate?: string;
            }>(
                pipe(
                    tap(() => {
                        patchState(store, { status: Status.LOADING });
                    }),
                    switchMap(({ programId, period, startDate, endDate }) => {
                        return programService.getDayWiseProgramAnalytics(programId, {
                            period,
                            startDate,
                            endDate,
                        }).pipe(
                            tapResponse({
                                next(response: any) {
                                    console.log('[DayWiseAnalyticsStore] Full API response:', response);
                                    // Check both result and data fields for compatibility
                                    const resultData = response?.result || response?.data || {};
                                    const dailyData = resultData?.dailyData || [];
                                    patchState(store, {
                                        dailyData,
                                        period: resultData?.period || period || '30days',
                                        dataType: resultData?.dataType || 'daily',
                                        startDate: resultData?.startDate || null,
                                        endDate: resultData?.endDate || null,
                                        error: null,
                                        status: Status.SUCCESS,
                                    });
                                },
                                error(error: HttpErrorResponse) {
                                    patchState(store, {
                                        dailyData: [],
                                        period: period || '30days',
                                        dataType: 'daily',
                                        startDate: null,
                                        endDate: null,
                                        status: Status.ERROR,
                                        error,
                                    });
                                    snackbarService.openSnackBar('Error fetching day-wise analytics', '');
                                },
                            })
                        );
                    }),
                )
            ),
        })
    ),
);
