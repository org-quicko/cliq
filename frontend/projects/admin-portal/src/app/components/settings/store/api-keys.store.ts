import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { plainToInstance } from 'class-transformer';
import { ApiKeyDto, SnackbarService, Status } from '@org.quicko.cliq/ngx-core';
import { ApiKeysService } from '../../../services/api-keys.service';

export interface ApiKeysStoreState {
	apiKey: ApiKeyDto | null;
	error: any;
	status: Status;
}

export const initialApiKeysState: ApiKeysStoreState = {
	apiKey: null,
	error: null,
	status: Status.PENDING,
};

export const ApiKeysStore = signalStore(
	{ providedIn: 'root' },
	withState(initialApiKeysState),
	withDevtools('api-keys'),
	withMethods(
		(
			store,
			apiKeysService = inject(ApiKeysService),
			snackBarService = inject(SnackbarService),
		) => ({

			fetchApiKey: rxMethod<{ programId: string }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING, error: null })),
					switchMap(({ programId }) =>
						apiKeysService.fetchApiKey(programId).pipe(
							tapResponse({
								next(response) {
									const apiKey = response.data ? plainToInstance(ApiKeyDto, response.data) : null;
									patchState(store, {
										apiKey,
										status: Status.SUCCESS,
										error: null,
									});
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar('Failed to fetch API key', undefined);
								},
							})
						)
					)
				)
			),

			generateApiKey: rxMethod<{ programId: string }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING, error: null })),
					switchMap(({ programId }) =>
						apiKeysService.generateApiKey(programId).pipe(
							tapResponse({
								next(response) {
									const apiKey = plainToInstance(ApiKeyDto, response.data);
									patchState(store, {
										apiKey: apiKey ?? null,
										status: Status.SUCCESS,
										error: null,
									});
									snackBarService.openSnackBar('API key generated successfully', undefined);
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar('Failed to generate API key', undefined);
								},
							})
						)
					)
				)
			),

			resetState() {
				patchState(store, initialApiKeysState);
			},
			clearSecret() {
				const current = store.apiKey();
				if (current) {
					patchState(store, {
						apiKey: { ...current, secret: undefined },
					});
				}
			}
		})
	)
);
