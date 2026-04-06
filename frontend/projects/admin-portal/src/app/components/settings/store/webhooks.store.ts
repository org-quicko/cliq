import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { plainToInstance } from 'class-transformer';
import { SnackbarService, Status, CreateWebhookDto, WebhookDto, PaginatedList } from '@org.quicko.cliq/ngx-core';
import { WebhookService } from '../../../services/webhook.service';

export interface WebhooksStoreState {
	webhooks: WebhookDto[];
	count: number;
	error: any;
	status: Status;
}

export const initialWebhooksState: WebhooksStoreState = {
	webhooks: [],
	count: 0,
	error: null,
	status: Status.PENDING,
};

export const WebhooksStore = signalStore(
	withState(initialWebhooksState),
	withDevtools('webhooks'),
	withMethods(
		(
			store,
			webhookService = inject(WebhookService),
			snackBarService = inject(SnackbarService),
		) => ({
			fetchWebhooks: rxMethod<{ programId: string; skip?: number; take?: number }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING, error: null })),
					switchMap(({ programId, skip = 0, take = 10 }) =>
						webhookService.getAllWebhooks(programId, skip, take).pipe(
							tapResponse({
								next(response) {
									const paginatedResult = plainToInstance(
										PaginatedList<WebhookDto>,
										response?.data
									);

									const webhooks = paginatedResult.getItems()?.map((item: any) =>
										plainToInstance(WebhookDto, item)
									) ?? [];
									patchState(store, {
										webhooks,
										count: paginatedResult.getCount(),
										status: Status.SUCCESS,
										error: null,
									});
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar(
										'Failed to fetch webhooks',
										undefined
									);
								},
							})
						)
					)
				)
			),

			createWebhook: rxMethod<{ programId: string; body: CreateWebhookDto }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING, error: null })),
					switchMap(({ programId, body }) =>
						webhookService.createWebhook(programId, body).pipe(
							tapResponse({
								next(response) {
									const newWebhook = plainToInstance(WebhookDto, response.data);
									patchState(store, {
										webhooks: [...store.webhooks(), newWebhook],
										status: Status.SUCCESS,
										error: null,
									});
									snackBarService.openSnackBar('Webhook created successfully', undefined);
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar(
										'Failed to create webhook', '',
									);
								},
							})
						)
					)
				)
			),

			deleteWebhook: rxMethod<{ programId: string; webhookId: string }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING, error: null })),
					switchMap(({ programId, webhookId }) =>
						webhookService.deleteWebhook(programId, webhookId).pipe(
							tapResponse({
								next() {
									patchState(store, {
										webhooks: store.webhooks().filter(w => w.webhookId !== webhookId),
										status: Status.SUCCESS,
										error: null,
									});
									snackBarService.openSnackBar('Webhook deleted successfully', '');
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar('Failed to delete webhook', '');
								},
							})
						)
					)
				)
			),

			resetState() {
				patchState(store, initialWebhooksState);
			},
		})
	)
);
