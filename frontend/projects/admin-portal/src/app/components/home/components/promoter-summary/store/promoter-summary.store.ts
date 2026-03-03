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
import { PromoterWorkbook } from '@org-quicko/cliq-sheet-core/Promoter/beans';

export interface DailyData {
    date: string;
    signups: number;
    purchases: number;
    revenue: number;
    commission: number;
    signupCommission: number;
    purchaseCommission: number;
}

export interface PromoterSummaryData {
    totalRevenue: number;
    totalCommissions: number;
    signupCommission: number;
    purchaseCommission: number;
    totalSignups: number;
    totalPurchases: number;
}

export interface PromoterSummaryStoreState {
    promoterName: string;
    analytics: {
        data: PromoterSummaryData | null;
        dailyData: DailyData[];
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
                        programService.getPromoterSummaryAnalytics(programId, promoterId, period, startDate, endDate).pipe(
                            tapResponse({
                                next: (response) => {
                                    try {
                                        const workbook = plainToInstance(
                                            PromoterWorkbook,
                                            response?.data
                                        );

                                        const sheet = workbook.getPromoterAnalyticsSheet();
                                        const table = sheet.getPromoterAnalyticsTable();
                                        const row = table.getRow(0);
                                        const metadata = workbook.getMetadata();

                                        const dateWiseTable = sheet.getDateWisePromoterAnalyticsTable();
                                        const dailyData: DailyData[] = [];
                                        if (dateWiseTable) {
                                            const dateWiseRows = dateWiseTable.getRows() ?? [];
                                            for (let i = 0; i < dateWiseRows.length; i++) {
                                                const dateRow = dateWiseTable.getRow(i);
                                                dailyData.push({
                                                    date: dateRow.getDate() ?? '',
                                                    signups: Number(dateRow.getSignups() ?? 0),
                                                    purchases: Number(dateRow.getPurchases() ?? 0),
                                                    revenue: Number(dateRow.getRevenue() ?? 0),
                                                    commission: Number(dateRow.getCommission() ?? 0),
                                                    signupCommission: Number(dateRow.getSignupCommission() ?? 0),
                                                    purchaseCommission: Number(dateRow.getPurchaseCommission() ?? 0),
                                                });
                                            }
                                        }

                                        const analyticsData: PromoterSummaryData = {
                                            totalRevenue: Number(row.getTotalRevenue() ?? 0),
                                            totalCommissions: Number(row.getTotalCommission() ?? 0),
                                            signupCommission: Number(row.getSignupCommission() ?? 0),
                                            purchaseCommission: Number(row.getPurchaseCommission() ?? 0),
                                            totalSignups: Number(row.getTotalSignups() ?? 0),
                                            totalPurchases: Number(row.getTotalPurchases() ?? 0),
                                        };

                                        patchState(store, {
                                            promoterName: row.getPromoterName() || '',
                                            analytics: {
                                                data: analyticsData,
                                                dailyData,
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
                                                data: null,
                                                dailyData: [],
                                                dataType: 'daily',
                                                period: period || '30days',
                                                startDate: null,
                                                endDate: null,
                                                error,
                                                status: Status.ERROR,
                                            },
                                        });
                                        snackbarService.openSnackBar('Error parsing promoter analytics data', '');
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
                                            },
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
                                        },
                                    });
                                    snackbarService.openSnackBar('Error fetching promoter analytics', '');
                                },
                            })
                        )
                    ),
                )
            ),
        })
    ),
);
