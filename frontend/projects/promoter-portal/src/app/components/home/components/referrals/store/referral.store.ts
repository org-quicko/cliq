import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { of, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { LinkService } from '../../../../../services/link.service';
import { plainToInstance } from 'class-transformer';
import { PromoterService } from '../../../../../services/promoter.service';
import { referralSortByEnum, sortOrderEnum, Status } from '@org.quicko.cliq/ngx-core';
import { SnackbarService } from '@org.quicko.cliq/ngx-core';
import { ReferralTable, PromoterWorkbook, ReferralRow } from '@org.quicko.cliq/ngx-core/generated/sources/Promoter';

export interface ReferralStoreState {
	referrals: ReferralTable | null;
	selectedContact: { contactId: string, contactInfo: string } | null;
	rowsLength: number;
	error: any | null;
	status: Status;
	loadedPages: Set<number>;
};

export const initialReferralState: ReferralStoreState = {
	referrals: null,
	selectedContact: null,
	error: null,
	rowsLength: 0,
	status: Status.PENDING,
	loadedPages: new Set<number>()
};

export const ReferralStore = signalStore(
	withState(initialReferralState),

	withMethods(
		(
			store,
			promoterService = inject(PromoterService),
			snackbarService = inject(SnackbarService),
		) => ({

			getPromoterReferrals: rxMethod<{ sortOrder?: sortOrderEnum, sortBy?: referralSortByEnum, skip?: number, take?: number, isSorting?: boolean }>(
				pipe(

					tap(({ isSorting }) => {
						if (!isSorting) {
							patchState(store, { status: Status.LOADING });
						}
					}),

					switchMap(({ sortBy, sortOrder, skip, take, isSorting }) => {

						const page = Math.floor((skip ?? 0) / (take ?? 5));

						if (!isSorting && store.loadedPages().has(page)) {
							patchState(store, { status: Status.SUCCESS });
							return of(store.referrals());
						}

						return promoterService.getPromoterReferrals({ sort_by: sortBy, sort_order: sortOrder, skip, take }).pipe(
							tapResponse({
								next: (response) => {
									const referralTable = plainToInstance(PromoterWorkbook, response.data).getReferralSheet().getReferralTable();

									let currentReferralTable = store.referrals();

									const updatedPages = store.loadedPages().add(page);

									// append entries in case new entries incoming
									if (currentReferralTable && !isSorting) {
										const rows = referralTable.getRows();
										for (const row of rows) {
											const referral = new ReferralRow(row as any[]);
											currentReferralTable.addRow(referral);
										}

									} else {
										currentReferralTable = referralTable;
									}

									const updatedMemberTable = Object.assign(new ReferralTable(), currentReferralTable);

									patchState(store, {
										referrals: updatedMemberTable,
										status: Status.SUCCESS,
										rowsLength: Number(referralTable.getMetadata().get('count')),
										loadedPages: updatedPages
									});

								},
								error: (err) => {
									if (err instanceof Error) {
										patchState(store, { status: Status.ERROR, error: err.message });
										snackbarService.openSnackBar('Failed to fetch referrals', '');
									}
								}
							})
						)
					}),

				)
			),

			resetLoadedPages() {
				patchState(store, { loadedPages: new Set(), referrals: null, selectedContact: null });
			},

			getPerReferralCommissions: rxMethod<string>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap((contactId) => {
						return promoterService.getPromoterCommissions({ contact_id: contactId }).pipe(
							tapResponse({
								next(response) {
									console.log(response.data);
								},
								error(error) {

								},
							})
						)
					})
				)
			),

			setSelectedContact(contactId: string, contactInfo: string) {
				patchState(store, { selectedContact: { contactId, contactInfo } });
			},

			resetSelectedContact() {
				patchState(store, { selectedContact: null });
			}
		})
	),
);
