import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { plainToInstance } from 'class-transformer';
import { HttpErrorResponse } from '@angular/common/http';
import { withDevtools } from '@angular-architects/ngrx-toolkit';

import { CirclesService } from '../../../../../services/circles.service';
import { CircleWorkbook, CircleRow } from '@org-quicko/cliq-sheet-core/Circle/beans';
import { Status } from '@org.quicko.cliq/ngx-core';

export interface CirclesStoreState {
    circles: CircleRow[];
    total: number;
    skip: number;
    take: number;
    search: string | undefined;
    error: any | null;
    status: Status;
}

const initialState: CirclesStoreState = {
    circles: [],
    total: 0,
    skip: 0,
    take: 10,
    search: undefined,
    error: null,
    status: Status.PENDING,
};

export const CirclesStore = signalStore(
    withState(initialState),
    withDevtools('circles'),

    withComputed((store) => ({
        isLoading: computed(() => store.status() === Status.LOADING),
    })),

    withMethods((store, circlesService = inject(CirclesService)) => ({
        resetStore: () => {
            patchState(store, initialState);
        },

        fetchCircles: rxMethod<{
            programId: string;
            search?: string;
            skip?: number;
            take?: number;
        }>(
            pipe(
                tap(() => {
                    patchState(store, { status: Status.LOADING, circles: [] });
                }),

                switchMap(({ programId, search, skip = 0, take = 10 }) =>
                    circlesService
                        .getAllCircles(programId, search, skip, take)
                        .pipe(
                            tapResponse({
                                next(response) {
                                    const workbook = plainToInstance(
                                        CircleWorkbook,
                                        response?.data
                                    ) as CircleWorkbook;

                                    const sheet = workbook.getCircleSheet();
                                    const table = sheet.getCircleTable();

                                    const rows: CircleRow[] = [];
                                    for (let i = 0; i < table.getRows().length; i++) {
                                        rows.push(table.getRow(i));
                                    }

                                    const metadata = workbook.getMetadata();

                                    patchState(store, {
                                        circles: rows,
                                        total: (metadata?.get('total') as number) ?? 0,
                                        skip,
                                        take,
                                        search,
                                        error: null,
                                        status: Status.SUCCESS,
                                    });
                                },

                                error(error: HttpErrorResponse) {
                                    patchState(store, {
                                        circles: [],
                                        total: 0,
                                        status: Status.ERROR,
                                        error,
                                    });
                                },
                            })
                        )
                )
            )
        ),
    }))
);
