import { inject } from "@angular/core";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { of, pipe, switchMap, tap } from "rxjs";
import { tapResponse } from "@ngrx/operators";
import { plainToInstance } from "class-transformer";
import { Status, SnackbarService, ContactDto, ReferralDto, sortOrderEnum, referralSortByEnum } from "@org.quicko.cliq/ngx-core";
import { CommissionRow, CommissionTable, PromoterWorkbook } from "@org.quicko.cliq/ngx-core/generated/sources/Promoter";
import { PromoterService } from "../../../../../../services/promoter.service";
import { withDevtools } from "@angular-architects/ngrx-toolkit";
import { HttpErrorResponse } from "@angular/common/http";

export interface ReferralCommissionsStoreState {
	commissions: CommissionTable | null;
	contact: ReferralDto | null;
	error: any | null;
	status: Status;
	loadedPages: Set<number>;
};

export const initialCommissionState: ReferralCommissionsStoreState = {
	commissions: null,
	contact: null,
	error: null,
	status: Status.PENDING,
	loadedPages: new Set<number>()
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
			getReferralCommissions: rxMethod<{ sortOrder?: sortOrderEnum, sortBy?: referralSortByEnum, contactId: string, skip?: number, take?: number, isSorting?: boolean }>(
				pipe(
					tap(({ isSorting }) => {
						if (!isSorting) {
							patchState(store, { status: Status.LOADING });
						}
					}),

					switchMap(({ sortBy, sortOrder, contactId, skip, take, isSorting }) => {

						const page = Math.floor((skip ?? 0) / (take ?? 5));

						if (!isSorting && store.loadedPages().has(page)) {
							patchState(store, { status: Status.SUCCESS });
							return of(store.commissions()); // ✅ skip request if page already loaded
						}

						return promoterService.getPromoterCommissions({ sort_by: sortBy, sort_order: sortOrder, contact_id: contactId, skip, take }).pipe(
							tapResponse({
								next: (response) => {
									const commissionTable = plainToInstance(PromoterWorkbook, response.data).getCommissionSheet().getCommissionTable();

									let currentCommissionTable = store.commissions();

									const updatedPages = store.loadedPages().add(page);

									// append entries in case new entries incoming
									if (currentCommissionTable && !isSorting) {
										const rows = commissionTable.getRows();
										for (const row of rows) {
											const commission = new CommissionRow(row as any[]);
											currentCommissionTable.addRow(commission);
										}

									} else {
										currentCommissionTable = commissionTable;
									}

									const updatedMemberTable = Object.assign(new CommissionTable(), currentCommissionTable);

									patchState(store, {
										commissions: updatedMemberTable,
										status: Status.SUCCESS,
										loadedPages: updatedPages
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

			resetLoadedPages() {
				patchState(store, { loadedPages: new Set(), commissions: null, contact: null });
			},

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
