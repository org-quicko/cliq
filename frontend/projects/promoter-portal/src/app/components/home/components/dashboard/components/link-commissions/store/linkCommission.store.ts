import { inject } from "@angular/core";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, switchMap, tap } from "rxjs";
import { tapResponse } from "@ngrx/operators";
import { plainToInstance } from "class-transformer";
import { Status, SnackbarService, LinkDto } from "@org.quicko.cliq/ngx-core";
import { CommissionTable, PromoterWorkbook } from "@org.quicko.cliq/ngx-core/generated/sources/Promoter";
import { PromoterService } from "../../../../../../../services/promoter.service";
import { withDevtools } from "@angular-architects/ngrx-toolkit";
import { LinkService } from "../../../../../../../services/link.service";
import { HttpErrorResponse } from '@angular/common/http';

export interface LinkCommissionsStoreState {
	commissions: CommissionTable | null,
	link: LinkDto | null,
	error: any | null,
	status: Status,
};

export const initialCommissionState: LinkCommissionsStoreState = {
	commissions: null,
	link: null,
	error: null,
	status: Status.PENDING
};

export const LinkCommissionsStore = signalStore(
	withState(initialCommissionState),
	withDevtools('link_commissions'),
	withMethods(
		(
			store,
			linkService = inject(LinkService),
			promoterService = inject(PromoterService),
			snackBarService = inject(SnackbarService)
		) => ({

			getLinkCommissions: rxMethod<{ linkId: string, skip?: number, take?: number }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(({ linkId, skip, take }) => {
						return promoterService.getPromoterCommissions({ link_id: linkId, skip, take }).pipe(
							tapResponse({
								next: (response) => {
									patchState(store, {
										commissions: plainToInstance(PromoterWorkbook, response.data).getCommissionSheet().getCommissionTable(),
										status: Status.SUCCESS
									});
								},
								error: (error: HttpErrorResponse) => {
									if (error.status == 404) {
										patchState(store, { status: Status.SUCCESS, commissions: new CommissionTable(), error: null });
										return;
									}
									else {
										patchState(store, { status: Status.ERROR, error });
										snackBarService.openSnackBar('Failed to load commissions', '');
									}
								}
							})
						)
					})
				)
			),

			getLink: rxMethod<{ linkId: string }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(({ linkId }) => {
						return linkService.getLink(linkId).pipe(
							tapResponse({
								next(response) {
									patchState(store, {
										link: plainToInstance(LinkDto, response.data),
										status: Status.SUCCESS
									});
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar('Failed to load link', '');
								},
							})
						)
					})
				)
			),
		})
	),

)
