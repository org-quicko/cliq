import { withDevtools } from "@angular-architects/ngrx-toolkit";
import { HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { PromoterDto as Promoter, PromoterDto, Status, UpdatePromoterDto } from "@org.quicko.cliq/ngx-core";
import { pipe, switchMap, tap } from "rxjs";
import { PromoterService } from "../services/promoter.service";
import { tapResponse } from "@ngrx/operators";
import { SnackbarService } from "@org.quicko/ngx-core";
import { plainToInstance } from "class-transformer";

export interface PromoterStoreState {
	promoter: Promoter | null,
	error: any,
	status: Status
};

export const initialPromoterState: PromoterStoreState = {
	promoter: null,
	error: null,
	status: Status.PENDING
};

export const PromoterStore = signalStore(
	{ providedIn: 'root' },

	withState(initialPromoterState),
	withDevtools('promoter'),
	withMethods(
		(
			store,
			promoterService = inject(PromoterService),
			snackBarService = inject(SnackbarService),
		) => ({
			setPromoter: (promoter: Promoter) => {
				patchState(store, { promoter, status: Status.SUCCESS });
			},

			setStatus(status: Status, error: any = null) {
				if (status === Status.ERROR) {
					if (!error) {
						console.error('Must pass error object on an error status state.');
						throw new Error('Must pass error object on an error status state.');
					}

					patchState(store, { status, error });
				}

				patchState(store, { status });
			},

			updatePromoterInfo: rxMethod<{ updatedInfo: UpdatePromoterDto, programId: string, promoterId: string }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(({ updatedInfo, programId, promoterId, }) => {
						return promoterService.updatePromoterInfo(programId, promoterId, updatedInfo).pipe(
							tapResponse({
								next(response) {
									const promoterDto = plainToInstance(PromoterDto, response.data);

									patchState(store, { status: Status.SUCCESS, promoter: promoterDto, error: null });
									snackBarService.openSnackBar('Successfully updated promoter info!', '');
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar('Failed to update promoter info', '');
								},
							})
						)
					})
				)
			),

			removeMember: rxMethod<{ memberId: string, programId: string, promoterId: string }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(({ memberId, programId, promoterId, }) => {
						return promoterService.removeMember(programId, promoterId, memberId).pipe(
							tapResponse({
								next(response) {
									console.log(response.data);
									snackBarService.openSnackBar('Successfully removed member!', '');
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar('Failed to remove member', '');
								},
							})
						)
					})
				)
			),

			deletePromoter: rxMethod<{ programId: string, promoterId: string }>(
				pipe(
					switchMap(({ programId, promoterId, }) => {
						return promoterService.deletePromoter(programId, promoterId).pipe(
							tapResponse({
								next(response) {
									console.log(response);
									snackBarService.openSnackBar('Successfully deleted promoter', '');
								},
								error(error: Error) {
									if (error instanceof HttpErrorResponse) {
										console.error(error.error);
										patchState(store, { status: Status.ERROR, error });
										snackBarService.openSnackBar('Failed to delete promoter', '');
									}
								},
							})
						)
					})
				)
			),

			updatePromoterTncAcceptedStatus(accepted: boolean) {
				const promoter = Object.assign(new PromoterDto(), store.promoter());
				promoter.acceptedTermsAndConditions = accepted;

				patchState(store, { promoter });
			}

		})),
);
