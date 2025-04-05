import { inject } from "@angular/core";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, switchMap, tap } from "rxjs";
import { tapResponse } from "@ngrx/operators";
import { plainToInstance } from "class-transformer";
import { Status, SnackbarService, ContactDto, ReferralDto } from "@org.quicko.cliq/ngx-core";
import { CommissionTable, PromoterWorkbook } from "@org.quicko.cliq/ngx-core/generated/sources/Promoter";
import { PromoterService } from "../../../../../../services/promoter.service";
import { withDevtools } from "@angular-architects/ngrx-toolkit";
import { HttpErrorResponse } from "@angular/common/http";

export interface ReferralCommissionsStoreState {
	commissions: CommissionTable | null,
	contact: ReferralDto | null,
	error: any | null,
	status: Status
};

export const initialCommissionState: ReferralCommissionsStoreState = {
	commissions: null,
	contact: null,
	error: null,
	status: Status.PENDING
};

export const ReferralCommissionsStore = signalStore(
	withState(initialCommissionState),
	withDevtools('referral_commissions'),
	withMethods(
		(
			store,
			promoterService = inject(PromoterService),
			snackBarService = inject(SnackbarService)
		) => ({
			getReferralCommissions: rxMethod<{ contactId: string, skip?: number, take?: number }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(({ contactId, skip, take }) => {
						return promoterService.getPromoterCommissions({ contact_id: contactId, skip, take }).pipe(
							tapResponse({
								next: (response) => {
									patchState(store, {
										commissions: plainToInstance(PromoterWorkbook, response.data).getCommissionSheet().getCommissionTable(),
										status: Status.SUCCESS
									})
								},
								error: (error: HttpErrorResponse) => {
									if (error.status == 404) {
										patchState(store, { status: Status.SUCCESS, commissions: new CommissionTable() })
									} else {
										patchState(store, { status: Status.ERROR, error });
										snackBarService.openSnackBar('Failed to fetch commmissions for referral', '');
									}
								}
							})
						)
					})
				)
			),

			getReferral: rxMethod<{ contactId: string }>(
				pipe(
					switchMap(({ contactId }) => {
						return promoterService.getPromoterReferral(contactId).pipe(
							tapResponse({
								next: (response) => {
									patchState(store, {
										contact: plainToInstance(ReferralDto, response.data),
										status: Status.SUCCESS
									});
								},
								error: (error) => {
									if (error instanceof Error) {
										patchState(store, { status: Status.ERROR, error });
										snackBarService.openSnackBar('Failed to load referral', '');
									}
								}
							})
						)
					})
				)
			)
		})
	),

)
