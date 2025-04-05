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

			setStatus: (status: Status) => {
				patchState(store, { status });
			},

			updatePromoterInfo: rxMethod<UpdatePromoterDto>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap((updatedInfo) => {
						return promoterService.updatePromoterInfo(updatedInfo).pipe(
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

			removeMember: rxMethod<{ memberId: string }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(({ memberId }) => {
						return promoterService.removeMember(memberId).pipe(
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

			deletePromoter: rxMethod<void>(
				pipe(
					switchMap(() => {
						return promoterService.deletePromoter().pipe(
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
			)

		})),
);
