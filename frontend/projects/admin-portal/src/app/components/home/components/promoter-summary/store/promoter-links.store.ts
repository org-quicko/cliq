import { inject, computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { plainToInstance } from 'class-transformer';
import { ProgramService } from '../../../../../services/program.service';
import { Status, SnackbarService } from '@org.quicko.cliq/ngx-core';
import { PromoterWorkbook, LinkAnalyticsRow } from '@org-quicko/cliq-sheet-core/Promoter/beans';

export interface PromoterLinksStoreState {
    links: LinkAnalyticsRow[];
    website: string;
    total: number;
    skip: number;
    take: number;
    hasMore: boolean;
    period: string;
    sortOrder: 'ASC' | 'DESC';
    error: any | null;
    status: Status;
}

const initialState: PromoterLinksStoreState = {
    links: [],
    website: '',
    total: 0,
    skip: 0,
    take: 5,
    hasMore: false,
    period: '30days',
    sortOrder: 'DESC',
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
                sortOrder?: 'ASC' | 'DESC';
            }>(
                pipe(
                    tap(() => {
                        patchState(store, { status: Status.LOADING, links: [] });
                    }),
                    switchMap(({ programId, promoterId, period, startDate, endDate, skip = 0, take = 5, sortOrder = 'DESC' }) =>
                        programService.getPromoterLinksSummary(programId, promoterId, period, startDate, endDate, skip, take, sortOrder).pipe(
                            tapResponse({
                                next: (response) => {
                                    try {
                                        const workbook = plainToInstance(PromoterWorkbook, response?.data);
                                        const linkTable = workbook.getLinkAnalyticsSheet().getLinkAnalyticsTable();
                                        const tableMetadata = linkTable.getMetadata();

                                        const links : LinkAnalyticsRow[]= [];

                                         for (let i = 0; i < linkTable.getRows().length; i++) {
                                        links.push(linkTable.getRow(i));
                                    }

                                        const total = Number(tableMetadata?.get('count')) || 0;
                                        const website = (tableMetadata?.get('website') as string) || '';

                                        patchState(store, {
                                            links,
                                            website,
                                            total,
                                            skip,
                                            take,
                                            hasMore: Boolean(tableMetadata?.get('hasMore')),
                                            period: (tableMetadata?.get('period') as string) || period || '30days',
                                            sortOrder,
                                            error: null,
                                            status: Status.SUCCESS,
                                        });
                                    } catch (error) {
                                        patchState(store, {
                                            links: [],
                                            total: 0,
                                            hasMore: false,
                                            status: Status.ERROR,
                                            error,
                                        });
                                        snackbarService.openSnackBar('Error parsing promoter links data', '');
                                    }
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
