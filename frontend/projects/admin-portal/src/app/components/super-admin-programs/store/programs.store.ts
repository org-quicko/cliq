import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { inject } from '@angular/core';
import { ProgramService } from '../../../services/program.service';
import { SnackbarService } from '@org.quicko.cliq/ngx-core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { of, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';

export interface ProgramSummaryMvDto {
    programId: string;
    programName: string;
    totalPromoters: number;
    totalReferrals: number;
    createdAt: Date;
}

type ProgramsSummaryState = {
    programs: ProgramSummaryMvDto[] | null;
    isLoading: boolean;
    count: number | null;
    loadedPages: Set<number>;
    filter?: { name: string };
    error: string | null;
};

const initialState: ProgramsSummaryState = {
    programs: null,
    isLoading: false,
    count: null,
    loadedPages: new Set(),
    error: null,
};

export const ProgramsSummaryStore = signalStore(
    withState(initialState),
    withDevtools('programs-summary'),
    withMethods(
        (
            store,
            programService = inject(ProgramService),
            snackbarService = inject(SnackbarService)
        ) => ({
            fetchProgramsSummary: rxMethod<{
                filter?: { name: string };
                skip?: number;
                take?: number;
                isSortOperation?: boolean;
            }>(
                pipe(
                    tap(({ filter }) => {
                        if (filter) {
                            patchState(store, {
                                isLoading: false,
                            });
                        } else {
                            patchState(store, {
                                isLoading: true,
                            });
                        }
                    }),
                    switchMap(({ filter, skip, take, isSortOperation }) => {
                        const page = Math.floor((skip ?? 0) / (take ?? 10));

                        if (store.loadedPages().has(page) && !filter && !isSortOperation) {
                            patchState(store, { isLoading: false });
                            return of(store.programs());
                        }

                        return programService.getProgramSummary({
                            name: filter?.name,
                            skip,
                            take
                        }).pipe(
                            tapResponse({
                                next: (response) => {
                                    let programs: ProgramSummaryMvDto[] = [];
                                    let totalCount = 0;

                                    if (response.data) {
                                        const workbook = response.data;
                                        const sheet = workbook?.sheets?.[0];
                                        const table = sheet?.blocks?.[0];
                                        const rows = table?.rows || [];
                                        const header = table?.header || [];

                                        programs = rows.map((row: any[]) => ({
                                            programId: row[0],
                                            programName: row[1],
                                            totalPromoters: Number(row[2] ?? 0),
                                            totalReferrals: Number(row[3] ?? 0),
                                            createdAt: new Date(row[4]),
                                        }));

                                        const metadata = workbook?.metadata;
                                        totalCount = metadata?.pagination?.total ?? programs.length;
                                    }

                                    const currentPrograms = store.programs() ?? [];
                                    let updatedPrograms: ProgramSummaryMvDto[] = [];
                                    const updatedPages = store.loadedPages().add(page);

                                    if (filter) {
                                        updatedPrograms = [...programs];
                                    } else {
                                        updatedPrograms = [...currentPrograms, ...programs];
                                    }

                                    patchState(store, {
                                        programs: updatedPrograms,
                                        count: totalCount,
                                        isLoading: false,
                                        loadedPages: updatedPages,
                                        error: null,
                                    });
                                },
                                error: (error: HttpErrorResponse) => {
                                    if (error.status == 404) {
                                        patchState(store, {
                                            isLoading: false,
                                            programs: [],
                                            error: null,
                                            count: null
                                        });
                                    } else if (error.status == 403) {
                                        patchState(store, {
                                            isLoading: false,
                                            programs: [],
                                            error: 'Access denied. Super admin privileges required.',
                                            count: null
                                        });
                                        snackbarService.openSnackBar(
                                            'Access denied. Super admin privileges required.',
                                            undefined
                                        );
                                    } else {
                                        patchState(store, {
                                            error: error.message,
                                        });

                                        snackbarService.openSnackBar(
                                            'Error fetching programs summary',
                                            undefined
                                        );
                                    }
                                },
                            })
                        );
                    })
                )
            ),

            resetLoadedPages() {
                patchState(store, {
                    loadedPages: new Set(),
                });
            },

            resetPrograms() {
                patchState(store, {
                    programs: null
                });
            }
        })
    )
);
