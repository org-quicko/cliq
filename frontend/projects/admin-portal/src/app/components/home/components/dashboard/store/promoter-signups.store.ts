import { inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Status, SnackbarService, SortByEnum } from '@org.quicko.cliq/ngx-core';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { HttpErrorResponse } from '@angular/common/http';
import { ProgramService } from '../../../../../services/program.service';
import { computed } from '@angular/core';
import { plainToInstance } from 'class-transformer';
import { PromotersAnalyticsWorkbook } from '@org-quicko/cliq-sheet-core/PromoterAnalytics/beans';

export interface PromoterData {
    promoterId: string;
    promoterName: string;
    signups: number;
    purchases: number;
    revenue: number;
    commission: number;
    signupCommission: number;
    purchaseCommission: number;
}

export interface PromoterSignupsStoreState {
    promoters: PromoterData[];
    total: number;
    skip: number;
    take: number;
    hasMore: boolean;
    error: any | null;
    status: Status;
    loadingMore: boolean;
}

export const initialPromoterSignupsState: PromoterSignupsStoreState = {
    promoters: [],
    total: 0,
    skip: 0,
    take: 20,
    hasMore: false,
    error: null,
    status: Status.PENDING,
    loadingMore: false,
};

export const PromoterSignupsStore = signalStore(
    withState(initialPromoterSignupsState),
    withDevtools('promoter-signups'),
    withComputed((store) => ({
        isLoading: computed(() => store.status() === Status.LOADING),
        isLoadingMore: computed(() => store.loadingMore()),
        topPopularityData: computed(() => {
            return store.promoters()
                .slice(0, 5)
                .map(p => ({
                    label: p.promoterName,
                    value: p.signupCommission,
                    subValue: p.signups,
                    revenue: p.revenue,
                }));
        }),

        popularityData: computed(() => {
            return store.promoters()
                .map(p => ({
                    label: p.promoterName,
                    value: p.signupCommission,
                    subValue: p.signups,
                    revenue: p.revenue,
                }));
        }),
    })),
    withMethods(
        (
            store,
            programService = inject(ProgramService),
            snackbarService = inject(SnackbarService),
        ) => ({
            resetStore: () => {
                patchState(store, initialPromoterSignupsState);
            },
            fetchPromotersBySignups: rxMethod<{
                programId: string;
                sortBy?: SortByEnum;
                period?: string;
                startDate?: string;
                endDate?: string;
                skip?: number;
                take?: number;
            }>(
                pipe(
                    tap(() => {
                        patchState(store, { status: Status.LOADING, promoters: [] });
                    }),
                    switchMap(({ programId, sortBy = SortByEnum.SIGNUP_COMMISSION, period, startDate, endDate, skip = 0, take = 20 }) => {
                        return programService.getPromoterAnalytics(
                            programId,
                            sortBy,
                            period,
                            startDate,
                            endDate,
                            skip,
                            take
                        ).pipe(
                            tapResponse({
                                next(response) {
                                    let promoters: PromoterData[] = [];
                                        const workbook = plainToInstance(PromotersAnalyticsWorkbook, response?.data) as PromotersAnalyticsWorkbook;                    
                                            const sheet = workbook.getPromoterAnalyticsSheet();
                                            const table = sheet.getPromoterAnalyticsTable();
                                            const rows = table.getRows();
                                            
                                            for (let i = 0; i < rows.length; i++) {
                                                const row = table.getRow(i);
                                                promoters.push({
                                                    promoterId: row.getPromoterId(),
                                                    promoterName: row.getPromoterName(),
                                                    signups: Number(row.getTotalSignups() ?? 0),
                                                    purchases: Number(row.getTotalPurchases() ?? 0),
                                                    revenue: Number(row.getTotalRevenue() ?? 0),
                                                    commission: Number(row.getTotalCommission() ?? 0),
                                                    signupCommission: Number(row.getSignupCommission() ?? 0),
                                                    purchaseCommission: Number(row.getPurchaseCommission() ?? 0),
                                                });
                                            }
                                        
                                    
                                    const metadata = workbook.getMetadata();
                                    patchState(store, {
                                        promoters,
                                        total: (metadata?.get('total') as number) ?? 0,
                                        hasMore: (metadata?.get('hasMore') as boolean) ?? false,
                                        skip,
                                        take,
                                        error: null,
                                        status: Status.SUCCESS,
                                    });
                                },
                                error(error: HttpErrorResponse) {
                                    patchState(store, {
                                        promoters: [],
                                        total: 0,
                                        hasMore: false,
                                        status: Status.ERROR,
                                        error,
                                    });
                                    snackbarService.openSnackBar('Error fetching promoters by signups', '');
                                },
                            })
                        );
                    }),
                )
            ),
            loadMorePromotersBySignups: rxMethod<{
                programId: string;
                sortBy?: SortByEnum;
                period?: string;
                startDate?: string;
                endDate?: string;
                skip?: number;
                take?: number;
            }>(
                pipe(
                    tap(() => {
                        patchState(store, { loadingMore: true });
                    }),
                    switchMap(({ programId, sortBy = SortByEnum.SIGNUP_COMMISSION, period, startDate, endDate, skip = 0, take = 20 }) => {
                        return programService.getPromoterAnalytics(
                            programId,
                            sortBy,
                            period,
                            startDate,
                            endDate,
                            skip,
                            take
                        ).pipe(
                            tapResponse({
                                next(response) {

                                    let newPromoters: PromoterData[] = [];
                               
                                        const workbook = plainToInstance(PromotersAnalyticsWorkbook, response?.data) as PromotersAnalyticsWorkbook;
                                        
                                            const sheet = workbook.getPromoterAnalyticsSheet();
                                            const table = sheet.getPromoterAnalyticsTable();
                                            const rows = table.getRows();
                                            
                                            for (let i = 0; i < rows.length; i++) {
                                                const row = table.getRow(i);
                                                newPromoters.push({
                                                    promoterId: row.getPromoterId(),
                                                    promoterName: row.getPromoterName(),
                                                    signups: Number(row.getTotalSignups() ?? 0),
                                                    purchases: Number(row.getTotalPurchases() ?? 0),
                                                    revenue: Number(row.getTotalRevenue() ?? 0),
                                                    commission: Number(row.getTotalCommission() ?? 0),
                                                    signupCommission: Number(row.getSignupCommission() ?? 0),
                                                    purchaseCommission: Number(row.getPurchaseCommission() ?? 0),
                                                });
                                            }
                                  
                              
                                    const existingPromoters = store.promoters();
                                    const metadata = workbook.getMetadata();
                                    patchState(store, {
                                        promoters: [...existingPromoters, ...newPromoters],
                                        total: (metadata?.get('total') as number) ?? 0,
                                        hasMore: (metadata?.get('hasMore') as boolean) ?? false,
                                        skip,
                                        take,
                                        loadingMore: false,
                                    });
                                },
                                error(error: HttpErrorResponse) {
                                    patchState(store, {
                                        loadingMore: false,
                                        error,
                                    });
                                    snackbarService.openSnackBar('Error loading more promoters', '');
                                },
                            })
                        );
                    }),
                )
            ),
        })
    ),
);
