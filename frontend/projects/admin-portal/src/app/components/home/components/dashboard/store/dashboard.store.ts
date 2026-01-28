import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Status, SnackbarService } from '@org.quicko.cliq/ngx-core';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { HttpErrorResponse } from '@angular/common/http';
import { ProgramService } from '../../../../../services/program.service';
import { plainToInstance } from 'class-transformer';
import { ProgramAnalyticsWorkbook } from '@org-quicko/cliq-sheet-core/ProgramAnalytics/beans';
import 'reflect-metadata';


export interface ProgramAnalyticsData {
    totalRevenue: number;
    totalCommissions: number;
    totalSignups: number;
    totalPurchases: number;
}

export interface DashboardStoreState {
    analytics: {
        data: ProgramAnalyticsData | null;
        period: string | null;
        error: any | null;
        status: Status;
    };
}

export const initialDashboardState: DashboardStoreState = {
    analytics: {
        data: null,
        period: '30days',
        error: null,
        status: Status.PENDING,
    },
};

export const DashboardStore = signalStore(
    withState(initialDashboardState),
    withDevtools('admin-dashboard'),
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
                        programService.getProgramAnalytics(programId, { period, startDate, endDate }).pipe(
                            tapResponse({

                                next: (response) => {
                                    try {
                                        
                                        const workbook = plainToInstance(ProgramAnalyticsWorkbook, response.data);

                                       
                                        const table = workbook
                                            .getProgramAnalyticsSheet()
                                            .getProgramAnalyticsTable();

                                        const row = table.getRow(0);

                                        const analyticsData: ProgramAnalyticsData = {
                                            totalRevenue: Number(row.getTotalRevenue()) || 0,
                                            totalCommissions: Number(row.getTotalCommissions()) || 0,
                                            totalSignups: Number(row.getTotalSignups()) || 0,
                                            totalPurchases: Number(row.getTotalPurchases()) || 0,
                                        };

                                        patchState(store, {
                                            analytics: {
                                                data: analyticsData,
                                                period: response.data.period || period || '30days',
                                                error: null,
                                                status: Status.SUCCESS,
                                            }
                                        });

                                    } catch (error) {
                                        console.error(' Workbook parsing failed:', error);

                                        patchState(store, {
                                            analytics: {
                                                data: null,
                                                period: period || '30days',
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
                                                period: period || '30days',
                                                error: null,
                                                status: Status.SUCCESS,
                                            }
                                        });
                                        return;
                                    }

                                    patchState(store, {
                                        analytics: {
                                            data: null,
                                            period: period || '30days',
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
