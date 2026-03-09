import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { plainToInstance } from 'class-transformer';
import { HttpErrorResponse } from '@angular/common/http';
import { withDevtools } from '@angular-architects/ngrx-toolkit';

import { ProgramService } from '../../../../../services/program.service';
import {
    PromotersAnalyticsWorkbook,
    PromoterAnalyticsRow,
} from '@org-quicko/cliq-sheet-core/PromoterAnalytics/beans';

import { Status } from '@org.quicko.cliq/ngx-core';

export interface PromotersStoreState {
    promoters: PromoterAnalyticsRow[];
    totalPromoters: number;
    activePromoters: number;
    archivedPromoters: number;
    total: number;
    skip: number;
    take: number;
    hasMore: boolean;
    search: string | undefined;
    error: any | null;
    status: Status;
}

const initialState: PromotersStoreState = {
    promoters: [],
    totalPromoters: 0,
    activePromoters: 0,
    archivedPromoters: 0,
    total: 0,
    skip: 0,
    take: 5,
    hasMore: false,
    search: undefined,
    error: null,
    status: Status.PENDING,
};

export const PromotersStore = signalStore(
    withState(initialState),
    withDevtools('promoters'),

    withComputed((store) => ({
        isLoading: computed(() => store.status() === Status.LOADING),
    })),

    withMethods((store, programService = inject(ProgramService)) => ({
        resetStore: () => {
            patchState(store, initialState);
        },

        fetchPromoters: rxMethod<{
            programId: string;
            search?: string;
            skip?: number;
            take?: number;
            order?: 'ASC' | 'DESC';
        }>(
            pipe(
                tap(() => {
                    patchState(store, { status: Status.LOADING, promoters: [] });
                }),

                switchMap(({ programId, search, skip = 0, take = 10, order = 'ASC' }) =>
                    programService
                        .getAllPromoters(programId, search, skip, take, order)
                        .pipe(
                            tapResponse({
                                next(response) {
                                    const workbook = plainToInstance(
                                        PromotersAnalyticsWorkbook,
                                        response?.data
                                    ) as PromotersAnalyticsWorkbook;

                                    const sheet = workbook.getPromoterAnalyticsSheet();
                                    const table = sheet.getPromoterAnalyticsTable();

                                    const rows: PromoterAnalyticsRow[] = [];

                                    for (let i = 0; i < table.getRows().length; i++) {
                                        rows.push(table.getRow(i));
                                    }

                                    const list = sheet.getPromoterAnalyticsList();

                                    const totalPromoters = Number(list?.valueOfTotalPromoters() ?? 0);
                                    const activePromoters = Number(list?.valueOfActivePromoters() ?? 0);
                                    const archivedPromoters = Number(list?.valueOfArchivedPromoters() ?? 0);

                                    const metadata = workbook.getMetadata();

                                    patchState(store, {
                                        promoters: rows,
                                        totalPromoters,
                                        activePromoters,
                                        archivedPromoters,
                                        total: (metadata?.get('total') as number) ?? 0,
                                        hasMore: (metadata?.get('hasMore') as boolean) ?? false,
                                        skip,
                                        take,
                                        search,
                                        error: null,
                                        status: Status.SUCCESS,
                                    });
                                },

                                error(error: HttpErrorResponse) {
                                    patchState(store, {
                                        promoters: [],
                                        totalPromoters: 0,
                                        activePromoters: 0,
                                        archivedPromoters: 0,
                                        total: 0,
                                        hasMore: false,
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