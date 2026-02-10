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

export interface PromoterPurchasesStoreState {
    promoters: PromoterData[];
    pagination: {
        total: number;
        skip: number;
        take: number;
        hasMore: boolean;
    } | null;
    error: any | null;
    status: Status;
    loadingMore: boolean;
}

export const initialPromoterPurchasesState: PromoterPurchasesStoreState = {
    promoters: [],
    pagination: null,
    error: null,
    status: Status.PENDING,
    loadingMore: false,
};

export const PromoterPurchasesStore = signalStore(
    withState(initialPromoterPurchasesState),
    withDevtools('promoter-purchases'),
    withComputed((store) => ({
        isLoading: computed(() => store.status() === Status.LOADING),
        isLoadingMore: computed(() => store.loadingMore()),
        hasMore: computed(() => store.pagination()?.hasMore ?? false),
        // Top 5 promoters (for dashboard) - order preserved from API (already sorted by sortBy)
        topPopularityData: computed(() => {
            return store.promoters()
                .slice(0, 5)
                .map(p => ({
                    label: p.promoterName,
                    value: p.purchaseCommission,
                    subValue: p.purchases,
                    revenue: p.revenue,
                }));
        }),
        // Full list (for "View all promoters") - order preserved from API
        popularityData: computed(() => {
            return store.promoters()
                .map(p => ({
                    label: p.promoterName,
                    value: p.purchaseCommission,
                    subValue: p.purchases,
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
                patchState(store, initialPromoterPurchasesState);
            },
            fetchPromotersByPurchases: rxMethod<{
                programId: string;
                sortBy?: 'purchase_commission' | 'revenue';
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
                    switchMap(({ programId, sortBy = 'purchase_commission', period, startDate, endDate, skip = 0, take = 20 }) => {
                        return programService.getPromoterAnalytics(programId, {
                            sortBy,
                            period,
                            startDate,
                            endDate,
                            skip,
                            take,
                        }).pipe(
                            tapResponse({
                                next(response) {
                                   
                                    console.log('[PromoterPurchasesStore] Full API response:', response);
                                    
                                    let promoters: PromoterData[] = [];
                                    let pagination = null;
                                    try {
                                        const sheets = response?.data?.sheets || [];
                                        const analyticsSheet = sheets.find((s: any) => s.name === 'promoter_analytics_sheet');
                                        if (analyticsSheet) {
                                            const tableBlock = analyticsSheet.blocks.find((b: any) => b.name === 'promoter_analytics_table');
                                            if (tableBlock) {
                                                const header = tableBlock.header;
                                                const rows = tableBlock.rows || [];
                                                promoters = rows.map((row: any[]) => {
                                                    const obj: any = {};
                                                    header.forEach((key: string, idx: number) => {
                                                        obj[key] = row[idx];
                                                    });
                                                    return {
                                                        promoterId: obj.promoter_id,
                                                        promoterName: obj.promoter_name,
                                                        signups: Number(obj.total_signups ?? 0),
                                                        purchases: Number(obj.total_purchases ?? 0),
                                                        revenue: Number(obj.total_revenue ?? 0),
                                                        commission: Number(obj.total_commission ?? 0),
                                                        signupCommission: Number(obj.signup_commission ?? 0),
                                                        purchaseCommission: Number(obj.purchase_commission ?? 0),
                                                    };
                                                });
                                            }
                                        }
            
                                        pagination = response?.data?.metadata?.pagination || null;
                                    } catch (e) {
                                        console.error('Error parsing workbook for promoter analytics:', e);
                                    }
                                    patchState(store, {
                                        promoters,
                                        pagination,
                                        error: null,
                                        status: Status.SUCCESS,
                                    });
                                },
                                error(error: HttpErrorResponse) {
                                    patchState(store, {
                                        promoters: [],
                                        pagination: null,
                                        status: Status.ERROR,
                                        error,
                                    });
                                    snackbarService.openSnackBar('Error fetching promoters by purchases', '');
                                },
                            })
                        );
                    }),
                )
            ),
            loadMorePromotersByPurchases: rxMethod<{
                programId: string;
                sortBy?: 'purchase_commission' | 'revenue';
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
                    switchMap(({ programId, sortBy = 'purchase_commission', period, startDate, endDate, skip = 0, take = 20 }) => {
                        return programService.getPromoterAnalytics(programId, {
                            sortBy,
                            period,
                            startDate,
                            endDate,
                            skip,
                            take,
                        }).pipe(
                            tapResponse({
                                next(response) {
                                    console.log('[PromoterPurchasesStore] Load more response:', response);
                                    let newPromoters: PromoterData[] = [];
                                    let pagination = null;
                                    try {
                                        const sheets = response?.data?.sheets || [];
                                        const analyticsSheet = sheets.find((s: any) => s.name === 'promoter_analytics_sheet');
                                        if (analyticsSheet) {
                                            const tableBlock = analyticsSheet.blocks.find((b: any) => b.name === 'promoter_analytics_table');
                                            if (tableBlock) {
                                                const header = tableBlock.header;
                                                const rows = tableBlock.rows || [];
                                                newPromoters = rows.map((row: any[]) => {
                                                    const obj: any = {};
                                                    header.forEach((key: string, idx: number) => {
                                                        obj[key] = row[idx];
                                                    });
                                                    return {
                                                        promoterId: obj.promoter_id,
                                                        promoterName: obj.promoter_name,
                                                        signups: Number(obj.total_signups ?? 0),
                                                        purchases: Number(obj.total_purchases ?? 0),
                                                        revenue: Number(obj.total_revenue ?? 0),
                                                        commission: Number(obj.total_commission ?? 0),
                                                        signupCommission: Number(obj.signup_commission ?? 0),
                                                        purchaseCommission: Number(obj.purchase_commission ?? 0),
                                                    };
                                                });
                                            }
                                        }
                                        pagination = response?.data?.metadata?.pagination || null;
                                    } catch (e) {
                                        console.error('Error parsing workbook for promoter analytics:', e);
                                    }
                                    // Append to existing promoters
                                    const existingPromoters = store.promoters();
                                    patchState(store, {
                                        promoters: [...existingPromoters, ...newPromoters],
                                        pagination,
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
