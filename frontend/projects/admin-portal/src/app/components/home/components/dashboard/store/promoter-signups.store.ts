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
}

export interface PromoterSignupsStoreState {
    promoters: PromoterData[];
    pagination: {
        total: number;
        skip: number;
        take: number;
        hasMore: boolean;
    } | null;
    error: any | null;
    status: Status;
}

export const initialPromoterSignupsState: PromoterSignupsStoreState = {
    promoters: [],
    pagination: null,
    error: null,
    status: Status.PENDING,
};

export const PromoterSignupsStore = signalStore(
    withState(initialPromoterSignupsState),
    withDevtools('promoter-signups'),
    withComputed((store) => ({
        isLoading: computed(() => store.status() === Status.LOADING),
        popularityData: computed(() => {
            return store.promoters().map(p => ({
                label: p.promoterName,
                value: p.commission,
                subValue: p.signups,
            }));
        }),
    })),
    withMethods(
        (
            store,
            programService = inject(ProgramService),
            snackbarService = inject(SnackbarService),
        ) => ({
            fetchPromotersBySignups: rxMethod<{
                programId: string;
                period?: string;
                startDate?: string;
                endDate?: string;
                skip?: number;
                take?: number;
            }>(
                pipe(
                    tap(() => {
                        patchState(store, { status: Status.LOADING });
                    }),
                    switchMap(({ programId, period, startDate, endDate, skip = 0, take = 5 }) => {
                        return programService.getPromoterAnalytics(programId, {
                            sortBy: 'signups',
                            period,
                            startDate,
                            endDate,
                            skip,
                            take,
                        }).pipe(
                            tapResponse({
                                next(response) {
                                    // Debug log
                                    console.log('[PromoterSignupsStore] Full API response:', response);
                
                                    let result: any = undefined;
                                    if (response.result) {
                                        result = response.result;
                                    } else if (response.data && response.data.result) {
                                        result = response.data.result;
                                    } else if (response.data) {
                                        result = response.data;
                                    } else {
                                        result = response;
                                    }
                                    console.log('[PromoterSignupsStore] Parsed result:', result);
                                    patchState(store, {
                                        promoters: result?.promoters || [],
                                        pagination: result?.pagination || null,
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
                                    snackbarService.openSnackBar('Error fetching promoters by signups', '');
                                },
                            })
                        );
                    }),
                )
            ),
        })
    ),
);
