import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { EventEmitter, inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { SnackbarService, Status } from '@org.quicko.cliq/ngx-core';
import { CreateWebhookDto, WebhookDto, WebhookService } from '../../../services/webhook.service';

export const onCreateWebhookSuccess = new EventEmitter<void>();
export const onDeleteWebhookSuccess = new EventEmitter<void>();

export interface WebhooksStoreState {
	webhooks: WebhookDto[];
	error: any;
	status: Status;
}

export const initialWebhooksState: WebhooksStoreState = {
	webhooks: [],
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
			fetchWebhooks: rxMethod<{ programId: string }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING, error: null })),
					switchMap(({ programId }) =>
						webhookService.getAllWebhooks(programId).pipe(
							tapResponse({
								next(response) {
									const webhooks = (response.data as WebhookDto[]) ?? [];
									patchState(store, {
										webhooks,
										status: Status.SUCCESS,
										error: null,
									});
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar('Failed to fetch webhooks', undefined);
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
									const newWebhook = response.data as WebhookDto;
									patchState(store, {
										webhooks: [...store.webhooks(), newWebhook],
										status: Status.SUCCESS,
										error: null,
									});
									snackBarService.openSnackBar('Webhook created successfully', undefined);
									onCreateWebhookSuccess.emit();
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar(
										'Failed to create webhook','',
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
										webhooks: store.webhooks().filter(w => w.webhook_id !== webhookId),
										status: Status.SUCCESS,
										error: null,
									});
									snackBarService.openSnackBar('Webhook deleted successfully', '');
									onDeleteWebhookSuccess.emit();
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
