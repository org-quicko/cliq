import { inject, computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { plainToInstance } from 'class-transformer';

import { CirclesService } from '../../../../../services/circles.service';
import { Status, SnackbarService, PromoterDto, PaginatedList } from '@org.quicko.cliq/ngx-core';

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
                search?: string;
                skip?: number;
                take?: number;
            }>(
                pipe(
                    tap(() => {
                        patchState(store, { status: Status.LOADING, promoters: [] });
                    }),

                    switchMap(({ programId, circleId, search, skip = 0, take = 5 }) =>
                        circlesService.getCirclePromoters(programId, circleId, search, skip, take).pipe(
                            tapResponse({
                                next(response) {
                                    const paginatedResult = plainToInstance(
                                        PaginatedList<PromoterDto>,
                                        response?.data
                                    );

                                    const promoters = paginatedResult.getItems()?.map((item: any) =>
                                        plainToInstance(PromoterDto, item)
                                    ) ?? [];

                                    patchState(store, {
                                        promoters,
                                        total: paginatedResult.getCount() ?? 0,
                                        skip,
                                        take,
                                        error: null,
                                        status: Status.SUCCESS,
                                    });
                                },
                                error(error: HttpErrorResponse) {
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
