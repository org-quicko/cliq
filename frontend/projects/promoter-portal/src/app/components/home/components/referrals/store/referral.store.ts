import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { LinkService } from '../../../../../services/link.service';
import { plainToInstance } from 'class-transformer';
import { PromoterService } from '../../../../../services/promoter.service';
import { referralSortByEnum, sortOrderEnum, Status } from '@org.quicko.cliq/ngx-core';
import { SnackbarService } from '@org.quicko.cliq/ngx-core';
import { ReferralTable, PromoterWorkbook } from '@org.quicko.cliq/ngx-core/generated/sources/Promoter';

export interface ReferralStoreState {
	referrals: ReferralTable | null,
	selectedContact: { contactId: string, contactInfo: string } | null,
	rowsLength: number,
	error: any | null,
	status: Status,
	skip: number,
	take: number
};

export const initialReferralState: ReferralStoreState = {
	referrals: null,
	selectedContact: null,
	error: null,
	rowsLength: 0,
	status: Status.PENDING,
	skip: 0,
	take: 5,
};

export const ReferralStore = signalStore(
	withState(initialReferralState),

	withMethods(
		(
			store,
			promoterService = inject(PromoterService),
			snackbarService = inject(SnackbarService),
		) => ({

			getPromoterReferrals: rxMethod<{ sortOrder?: sortOrderEnum, sortBy?: referralSortByEnum, skip?: number, take?: number }>(
				pipe(

					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(({ sortBy, sortOrder, skip, take }) => {
						return promoterService.getPromoterReferrals({ sort_by: sortBy, sort_order: sortOrder, skip, take }).pipe(
							tapResponse({
								next: (response) => {
									const referralTable = plainToInstance(PromoterWorkbook, response.data).getReferralSheet().getReferralTable();

									patchState(store, {
										referrals: referralTable,
										status: Status.SUCCESS,
										rowsLength: Number(referralTable.getMetadata().get('count'))
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
