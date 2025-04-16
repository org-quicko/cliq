import { inject } from "@angular/core";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { of, pipe, switchMap, tap } from "rxjs";
import { tapResponse } from "@ngrx/operators";
import { plainToInstance } from "class-transformer";
import { Status, ContactDto, ReferralDto, sortOrderEnum, referralSortByEnum, commissionSortByEnum } from "@org.quicko.cliq/ngx-core";
import { CommissionRow, CommissionTable, PromoterWorkbook } from "@org.quicko.cliq/ngx-core/generated/sources/Promoter";
import { PromoterService } from "../../../../../../services/promoter.service";
import { withDevtools } from "@angular-architects/ngrx-toolkit";
import { HttpErrorResponse } from "@angular/common/http";
import { SnackbarService } from "@org.quicko/ngx-core";

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
			getReferralCommissions: rxMethod<{
				sortOrder?: sortOrderEnum,
				sortBy?: commissionSortByEnum,
				contactId: string,
				skip?: number,
				take?: number,
				isSorting?: boolean,

				programId: string,
				promoterId: string,
			}>(
				pipe(
					tap(({ isSorting }) => {
						if (!isSorting) {
							patchState(store, { status: Status.LOADING });
						}
					}),

					switchMap(({ sortBy, sortOrder, contactId, skip, take, isSorting, programId, promoterId }) => {

						const page = Math.floor((skip ?? 0) / (take ?? 5));

						if (!isSorting && store.loadedPages().has(page)) {
							patchState(store, { status: Status.SUCCESS });
							return of(store.commissions()); // ✅ skip request if page already loaded
						}

						return promoterService.getPromoterCommissions(programId, promoterId, { sort_by: sortBy, sort_order: sortOrder, contact_id: contactId, skip, take }).pipe(
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
										loadedPages: updatedPages,
										contact: store.contact(),
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
				patchState(store, {
					loadedPages: new Set(),
				});
			},

			getReferral: rxMethod<{ contactId: string, programId: string, promoterId: string, }>(
				pipe(
					switchMap(({ contactId, programId, promoterId }) => {
						return promoterService.getPromoterReferral(programId, promoterId, contactId).pipe(
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
