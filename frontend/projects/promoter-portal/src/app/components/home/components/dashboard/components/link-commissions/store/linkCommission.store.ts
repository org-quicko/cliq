import { inject } from "@angular/core";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { of, pipe, switchMap, tap } from "rxjs";
import { tapResponse } from "@ngrx/operators";
import { plainToInstance } from "class-transformer";
import { Status, SnackbarService, LinkDto } from "@org.quicko.cliq/ngx-core";
import { CommissionRow, CommissionTable, PromoterWorkbook } from "@org.quicko.cliq/ngx-core/generated/sources/Promoter";
import { PromoterService } from "../../../../../../../services/promoter.service";
import { withDevtools } from "@angular-architects/ngrx-toolkit";
import { LinkService } from "../../../../../../../services/link.service";
import { HttpErrorResponse } from '@angular/common/http';

export interface LinkCommissionsStoreState {
	commissions: CommissionTable | null;
	link: LinkDto | null;
	error: any | null;
	status: Status;
	loadedPages: Set<number>;
};

export const initialCommissionState: LinkCommissionsStoreState = {
	commissions: null,
	link: null,
	error: null,
	status: Status.PENDING,
	loadedPages: new Set<number>()
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

			getLinkCommissions: rxMethod<{ linkId: string, skip?: number, take?: number, isSorting?: boolean }>(
				pipe(
					tap(({ isSorting }) => {
						if (!isSorting) {
							patchState(store, { status: Status.LOADING });
						}
					}),

					switchMap(({ linkId, skip, take, isSorting }) => {

						const page = Math.floor((skip ?? 0) / (take ?? 5));

						if (!isSorting && store.loadedPages().has(page)) {
							patchState(store, { status: Status.SUCCESS });
							return of(store.commissions()); // ✅ skip request if page already loaded
						}

						console.log('here');
						return promoterService.getPromoterCommissions({ link_id: linkId, skip, take }).pipe(
							tapResponse({
								next: (response) => {
									const commissionsTable = plainToInstance(PromoterWorkbook, response.data).getCommissionSheet().getCommissionTable()

									let currentCommissionsTable = store.commissions();

									const updatedPages = store.loadedPages().add(page);

									// append entries in case new entries incoming
									if (currentCommissionsTable && !isSorting) {
										const rows = commissionsTable.getRows();
										for (const row of rows) {
											const commission = new CommissionRow(row as any[]);
											currentCommissionsTable.addRow(commission);
										}

									} else {
										currentCommissionsTable = commissionsTable;
									}

									const updatedMemberTable = Object.assign(new CommissionTable(), currentCommissionsTable);

									patchState(store, { commissions: updatedMemberTable, status: Status.SUCCESS, loadedPages: updatedPages });
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

			resetLoadedPages() {
				patchState(store, { loadedPages: new Set(), commissions: null, link: null });
			},

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
