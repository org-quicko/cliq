import { inject, computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { plainToInstance } from 'class-transformer';

import { CirclesService } from '../../../../../services/circles.service';
import { Status, SnackbarService, CircleDto } from '@org.quicko.cliq/ngx-core';

export interface CircleSummaryStoreState {
    circle: CircleDto | null;
    error: any | null;
    status: Status;
}

const initialState: CircleSummaryStoreState = {
    circle: null,
    error: null,
    status: Status.PENDING,
};

export const CircleSummaryStore = signalStore(
    withState(initialState),
    withDevtools('circle-summary'),

    withComputed((store) => ({
        isLoading: computed(() => store.status() === Status.LOADING),
        circleName: computed(() => store.circle()?.name ?? ''),
        circleId: computed(() => store.circle()?.circleId ?? ''),
        isDefaultCircle: computed(() => store.circle()?.isDefaultCircle ?? false),
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

            fetchCircle: rxMethod<{
                programId: string;
                circleId: string;
            }>(
                pipe(
                    tap(() => {
                        patchState(store, { status: Status.LOADING, error: null });
                    }),

                    switchMap(({ programId, circleId }) =>
                        circlesService.getCircle(programId, circleId).pipe(
                            tapResponse({
                                next: (response) => {
                                    try {
                                        const circle = plainToInstance(CircleDto, response?.data);

                                        patchState(store, {
                                            circle,
                                            error: null,
                                            status: Status.SUCCESS,
                                        });
                                    } catch (error) {
                                        patchState(store, {
                                            circle: null,
                                            error,
                                            status: Status.ERROR,
                                        });
                                        snackbarService.openSnackBar('Error parsing circle data', '');
                                    }
                                },
                                error: (error: HttpErrorResponse) => {
                                    patchState(store, {
                                        circle: null,
                                        error,
                                        status: Status.ERROR,
                                    });
                                    snackbarService.openSnackBar('Error fetching circle', '');
                                },
                            })
                        )
                    )
                )
            ),
        })
    ),
);
