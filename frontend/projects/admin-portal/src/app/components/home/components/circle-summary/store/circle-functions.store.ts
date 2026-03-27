import { inject, computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { plainToInstance } from 'class-transformer';

import { CirclesService } from '../../../../../services/circles.service';
import { Status, SnackbarService, FunctionDto, PaginatedList } from '@org.quicko.cliq/ngx-core';

export interface CircleFunctionsStoreState {
    functions: FunctionDto[];
    total: number;
    skip: number;
    take: number;
    error: any | null;
    status: Status;
}

const initialState: CircleFunctionsStoreState = {
    functions: [],
    total: 0,
    skip: 0,
    take: 5,
    error: null,
    status: Status.PENDING,
};

export const CircleFunctionsStore = signalStore(
    withState(initialState),
    withDevtools('circle-functions'),

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

            fetchCircleFunctions: rxMethod<{
                programId: string;
                circleId: string;
                skip?: number;
                take?: number;
            }>(
                pipe(
                    tap(() => {
                        patchState(store, { status: Status.LOADING, functions: [] });
                    }),

                    switchMap(({ programId, circleId, skip = 0, take = 5 }) =>
                        circlesService.getCircleFunctions(programId, circleId, skip, take).pipe(
                            tapResponse({
                                next(response) {
                                    const paginatedResult = plainToInstance(
                                        PaginatedList<FunctionDto>,
                                        response?.data
                                    );

                                    const functions = paginatedResult.getItems()?.map((item: any) =>
                                        plainToInstance(FunctionDto, item)
                                    ) ?? [];

                                    patchState(store, {
                                        functions,
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
                                            functions: [],
                                            total: 0,
                                            error: null,
                                            status: Status.SUCCESS,
                                        });
                                        return;
                                    }

                                    patchState(store, {
                                        functions: [],
                                        total: 0,
                                        error,
                                        status: Status.ERROR,
                                    });
                                    snackbarService.openSnackBar('Error fetching functions', '');
                                },
                            })
                        )
                    )
                )
            ),
        })
    ),
);
