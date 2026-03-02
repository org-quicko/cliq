import { inject, computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { ProgramService } from '../../../../../services/program.service';
import { Status, SnackbarService } from '@org.quicko.cliq/ngx-core';

export interface PromoterLinkItem {
    linkId: string;
    name: string;
    refVal: string;
    signups: number;
    purchases: number;
    commission: number;
    createdAt: string;
}

export interface PromoterLinksStoreState {
    links: PromoterLinkItem[];
    total: number;
    skip: number;
    take: number;
    hasMore: boolean;
    period: string;
    error: any | null;
    status: Status;
}

const initialState: PromoterLinksStoreState = {
    links: [],
    total: 0,
    skip: 0,
    take: 5,
    hasMore: false,
    period: '30days',
    error: null,
    status: Status.PENDING,
};

export const PromoterLinksStore = signalStore(
    withState(initialState),
    withDevtools('promoter-links'),
    withComputed((store) => ({
        isLoading: computed(() => store.status() === Status.LOADING),
    })),
    withMethods(
        (
            store,
            programService = inject(ProgramService),
            snackbarService = inject(SnackbarService),
        ) => ({
            fetchPromoterLinks: rxMethod<{
                programId: string;
                promoterId: string;
                period?: string;
                startDate?: string;
                endDate?: string;
                skip?: number;
                take?: number;
            }>(
                pipe(
                    tap(() => {
                        patchState(store, { status: Status.LOADING, links: [] });
                    }),
                    switchMap(({ programId, promoterId, period, startDate, endDate, skip = 0, take = 5 }) =>
                        programService.getPromoterLinksSummary(programId, promoterId, period, startDate, endDate, skip, take).pipe(
                            tapResponse({
                                next: (response) => {
                                    const result = response?.data;
                                    const links: PromoterLinkItem[] = (result?.links || []).map((link: any) => ({
                                        linkId: link.linkId,
                                        name: link.name,
                                        refVal: link.refVal,
                                        signups: Number(link.signups) || 0,
                                        purchases: Number(link.purchases) || 0,
                                        commission: Number(link.commission) || 0,
                                        createdAt: link.createdAt,
                                    }));

                                    patchState(store, {
                                        links,
                                        total: result?.total || 0,
                                        skip,
                                        take,
                                        hasMore: result?.hasMore || false,
                                        period: result?.period || period || '30days',
                                        error: null,
                                        status: Status.SUCCESS,
                                    });
                                },
                                error: (error: HttpErrorResponse) => {
                                    patchState(store, {
                                        links: [],
                                        total: 0,
                                        hasMore: false,
                                        status: Status.ERROR,
                                        error,
                                    });
                                    snackbarService.openSnackBar('Error fetching promoter links', '');
                                },
                            })
                        )
                    ),
                )
            ),
        })
    ),
);
