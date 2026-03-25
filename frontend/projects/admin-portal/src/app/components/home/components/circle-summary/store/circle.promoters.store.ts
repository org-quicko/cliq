import { inject, computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { plainToInstance } from 'class-transformer';

import { CirclesService } from '../../../../../services/circles.service';
import { Status, SnackbarService, PromoterDto } from '@org.quicko.cliq/ngx-core';

export interface CirclePromotersStoreState {
    promoters: PromoterDto[];
    total: number;
    skip: number;
    take: number;
    error: any | null;
    status: Status;
}

const initialState: CirclePromotersStoreState = {
    promoters: [],
    total: 0,
    skip: 0,
    take: 5,
    error: null,
    status: Status.PENDING,
};

export const CirclePromotersStore = signalStore(
    withState(initialState),
    withDevtools('circle-promoters'),

    withComputed((store) => ({
        isLoading: computed(() => store.status() === Status.LOADING),
        hasMore: computed(() => store.skip() + store.take() < store.total()),
    })),

    withMethods(
        (
            store,
            circlesService = inject(CirclesService),
            snackbarService = inject(SnackbarService),
        ) => ({
            resetStore: () => {
                patchState(store, initialState);
            },

            fetchCirclePromoters: rxMethod<{
                programId: string;
                circleId: string;
                name?: string;
                skip?: number;
                take?: number;
            }>(
                pipe(
                    tap(() => {
                        patchState(store, { status: Status.LOADING, promoters: [] });
                    }),

                    switchMap(({ programId, circleId, name, skip = 0, take = 5 }) =>
                        circlesService.getCirclePromoters(programId, circleId, name, skip, take).pipe(
                            tapResponse({
                                next: (response) => {
                                    try {
                                        const result = response?.data;
                                        const promoters = Array.isArray(result)
                                            ? result.map((item: any) => plainToInstance(PromoterDto, item))
                                            : [];

                                        patchState(store, {
                                            promoters,
                                            total: promoters.length,
                                            skip,
                                            take,
                                            error: null,
                                            status: Status.SUCCESS,
                                        });
                                    } catch (error) {
                                        patchState(store, {
                                            promoters: [],
                                            total: 0,
                                            error,
                                            status: Status.ERROR,
                                        });
                                        snackbarService.openSnackBar('Error parsing promoters data', '');
                                    }
                                },
                                error: (error: HttpErrorResponse) => {
                                    if (error.status === 404) {
                                        patchState(store, {
                                            promoters: [],
                                            total: 0,
                                            error: null,
                                            status: Status.SUCCESS,
                                        });
                                        return;
                                    }

                                    patchState(store, {
                                        promoters: [],
                                        total: 0,
                                        error,
                                        status: Status.ERROR,
                                    });
                                    snackbarService.openSnackBar('Error fetching promoters', '');
                                },
                            })
                        )
                    )
                )
            ),
        })
    ),
);
