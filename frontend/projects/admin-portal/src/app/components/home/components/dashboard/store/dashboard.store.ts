import { inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Status, SnackbarService } from '@org.quicko.cliq/ngx-core';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { HttpErrorResponse } from '@angular/common/http';
import { ProgramService } from '../../../../../services/program.service';
import { plainToInstance } from 'class-transformer';
import { ProgramAnalyticsSheet, ProgramAnalyticsTable, ProgramAnalyticsWorkbook } from '@org-quicko/cliq-sheet-core/ProgramAnalytics/beans';
import 'reflect-metadata';
import { computed } from '@angular/core';


export interface DailyData {
    date: string;
    signups: number;
    purchases: number;
    revenue: number;
    commission: number;
}

export interface ProgramAnalyticsData {
    totalRevenue: number;
    totalCommissions: number;
    totalSignups: number;
    totalPurchases: number;
}

export interface DashboardStoreState {
    analytics: {
        data: ProgramAnalyticsData | null;
        dailyData: DailyData[];
        dataType: string | null;
        period: string | null;
        startDate: string | null;
        endDate: string | null;
        error: any | null;
        status: Status;
    };
}

export const initialDashboardState: DashboardStoreState = {
    analytics: {
        data: null,
        dailyData: [],
        dataType: 'daily',
        period: '30days',
        startDate: null,
        endDate: null,
        error: null,
        status: Status.PENDING,
    },
};

export const DashboardStore = signalStore(
    withState(initialDashboardState),
    withDevtools('admin-dashboard'),
    withComputed((store) => ({
        isLoading: computed(() => store.analytics().status === Status.LOADING),
    })),
    withMethods(
        (
            store,
            programService = inject(ProgramService),
            snackbarService = inject(SnackbarService),
        ) => ({

            getProgramAnalytics: rxMethod<{
                programId: string;
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
                                error: null
                            }
                        });
                    }),

                    switchMap(({ programId, period, startDate, endDate }) =>
                        programService.getProgramAnalytics(programId, period, startDate, endDate).pipe(
                            tapResponse({

                                next: (response) => {
                                    try {
                                        const workbook = plainToInstance(ProgramAnalyticsWorkbook, response?.data);
                                        const sheet = workbook.getProgramAnalyticsSheet() as ProgramAnalyticsSheet;
                                        const table = sheet.getProgramAnalyticsTable() as ProgramAnalyticsTable;
                                        const row = table.getRow(0);

                                        const analyticsData: ProgramAnalyticsData = {
                                            totalRevenue: row.getTotalRevenue() || 0,
                                            totalCommissions: row.getTotalCommissions() || 0,
                                            totalSignups: row.getTotalSignups() || 0,
                                            totalPurchases: row.getTotalPurchases() || 0,
                                        };

                                        const metadata = workbook.getMetadata();
                                        const dailyDataStr = metadata?.get('dailyData') as string;
                                        const dailyData = dailyDataStr ? JSON.parse(dailyDataStr) : [];

                                        patchState(store, {
                                            analytics: {
                                                data: analyticsData,
                                                dailyData: dailyData || [],
                                                dataType: (metadata?.get('dataType') as string) || 'daily',
                                                period: (metadata?.get('period') as string) || period || '30days',
                                                startDate: (metadata?.get('startDate') as string) || null,
                                                endDate: (metadata?.get('endDate') as string) || null,
                                                error: null,
                                                status: Status.SUCCESS,
                                            }
                                        });
                                    } catch (error) {

                                        patchState(store, {
                                            analytics: {
                                                data: null,
                                                dailyData: [],
                                                dataType: 'daily',
                                                period: period || '30days',
                                                startDate: null,
                                                endDate: null,
                                                error,
                                                status: Status.ERROR,
                                            }
                                        });

                                        snackbarService.openSnackBar('Error parsing analytics data', '');
                                    }
                                },

                                error: (error: HttpErrorResponse) => {
                                    if (error.status === 404) {
                                        patchState(store, {
                                            analytics: {
                                                data: null,
                                                dailyData: [],
                                                dataType: 'daily',
                                                period: period || '30days',
                                                startDate: null,
                                                endDate: null,
                                                error: null,
                                                status: Status.SUCCESS,
                                            }
                                        });
                                        return;
                                    }

                                    patchState(store, {
                                        analytics: {
                                            data: null,
                                            dailyData: [],
                                            dataType: 'daily',
                                            period: period || '30days',
                                            startDate: null,
                                            endDate: null,
                                            error,
                                            status: Status.ERROR,
                                        }
                                    });

                                    snackbarService.openSnackBar('Error fetching program analytics', '');
                                }

                            })
                        )
                    ),
                )
            ),

            setPeriod(period: string) {
                patchState(store, {
                    analytics: {
                        ...store.analytics(),
                        period,
                    }
                });
            },

        })
    ),
);
