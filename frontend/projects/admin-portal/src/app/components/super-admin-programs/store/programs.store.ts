import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { inject } from '@angular/core';
import { ProgramService } from '../../../services/program.service';
import { SnackbarService } from '@org.quicko.cliq/ngx-core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { of, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { plainToInstance } from 'class-transformer';
import { ProgramSummaryViewWorkbook, ProgramSummaryViewRow, ProgramSummaryViewSheet, ProgramSummaryViewTable } from '@org-quicko/cliq-sheet-core/ProgramSummaryView/beans';

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
    filter?: { name: string };
    error: string | null;
};

const initialState: ProgramsSummaryState = {
    programs: null,
    isLoading: false,
    count: null,
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
                        patchState(store, { isLoading: true });

                        return programService.getProgramSummary(
                            undefined,
                            filter?.name,
                            skip,
                            take
                        ).pipe(
                            tapResponse({
                                next: (response) => {
                                    let programs: ProgramSummaryMvDto[] = [];
                                    let totalCount = 0;

                                    if (response.data) {
                                        const workbook = plainToInstance(ProgramSummaryViewWorkbook, response.data);
                                        const sheet = workbook.getProgramSummaryViewSheet();
                                        const table = sheet.getProgramSummaryViewTable();
                                        const rows = table.getRows();

                                        for (let i = 0; i < rows.length; i++) {
                                            const row = table.getRow(i);
                                            programs.push({
                                                programId: row.getProgramId(),
                                                programName: row.getProgramName(),
                                                totalPromoters: Number(row.getTotalPromoters() ?? 0),
                                                totalReferrals: Number(row.getTotalReferrals() ?? 0),
                                                createdAt: new Date(row.getCreatedAt()),
                                            });
                                        }

                                        const metadata = workbook.getMetadata();
                                        totalCount = (metadata?.get('total') as number) ?? programs.length;
                                    }

                                    patchState(store, {
                                        programs: programs,
                                        count: totalCount,
                                        isLoading: false,
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

            resetPrograms() {
                patchState(store, {
                    programs: null
                });
            }
        })
    )
);
