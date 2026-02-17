import { EventEmitter, inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { ProgramService } from '../../../services/program.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { SnackbarService, ProgramDto } from '@org.quicko.cliq/ngx-core';

export const OnCreateProgramSuccess: EventEmitter<boolean> = new EventEmitter();

type CreateProgramState = {
    createdProgram: ProgramDto | null;
    isLoading: boolean;
    error: string | null;
    onNext: boolean;
};

const initialState: CreateProgramState = {
    createdProgram: null,
    isLoading: false,
    error: null,
    onNext: false,
};

export const CreateProgramStore = signalStore(
    withState(initialState),
    withDevtools('create-program'),
    withMethods(
        (
            store,
            programService = inject(ProgramService),
            snackbarService = inject(SnackbarService)
        ) => ({
            createProgram: rxMethod<{ body: any }>(
                pipe(
                    tap(() => {
                        patchState(store, { isLoading: true, error: null });
                    }),
                    switchMap(({ body }) => {
                        return programService.createProgram(body).pipe(
                            tapResponse({
                                next: (response) => {
                                    patchState(store, {
                                        createdProgram: response.data,
                                        isLoading: false,
                                        error: null,
                                    });
                                    snackbarService.openSnackBar('Program created successfully', '');
                                    OnCreateProgramSuccess.emit(true);
                                },
                                error: (error: HttpErrorResponse) => {
                                    patchState(store, {
                                        isLoading: false,

                                    });
                                    snackbarService.openSnackBar(
                                        'Failed to create program',
                                        ''
                                    );
                                    OnCreateProgramSuccess.emit(false);
                                },
                            })
                        );
                    })
                )
            ),

            setOnNext() {
                patchState(store, { onNext: !store.onNext() });
            },

            resetStore() {
                patchState(store, initialState);
            },
        })
    )
);
