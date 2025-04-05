import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, shareReplay, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
// import { CreateLinkDto, LinkDto, LinkStatsTable, PromoterWorkbook, SnackbarService, Status } from '@org.quicko.cliq/ngx-core';
import { LinkService } from '../../../../../services/link.service';
import { plainToInstance } from 'class-transformer';
import { PromoterService } from '../../../../../services/promoter.service';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { Status, CreateLinkDto } from '@org.quicko.cliq/ngx-core';
import { SnackbarService } from '@org.quicko.cliq/ngx-core';
import { LinkStatsRow, LinkStatsTable, PromoterWorkbook } from '@org.quicko.cliq/ngx-core/generated/sources/Promoter';
import { LinkRow } from '@org.quicko.cliq/ngx-core/generated/sources/Link';
import { HttpErrorResponse } from '@angular/common/http';
import { JSONArray } from '@org.quicko/ngx-core';

export interface LinkStoreState {
	links: LinkStatsTable | null,
	error: any | null,
	status: Status,
	skip: number,
	take: number
};

export const initialLinkState: LinkStoreState = {
	links: null,
	error: null,
	status: Status.PENDING,
	skip: 0,
	take: 4,
};


export const LinkStore = signalStore(
	withState(initialLinkState),
	withDevtools('link'),
	withMethods(
		(
			store,
			linkService = inject(LinkService),
			promoterService = inject(PromoterService),
			snackbarService = inject(SnackbarService),
		) => ({

			getPromoterLinks: rxMethod<void>(
				pipe(

					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(() => {
						return linkService.getPromoterLinkStatistics().pipe(
							tapResponse({
								next: (response) => {
									const linkTable = plainToInstance(PromoterWorkbook, response.data).getLinkStatsSheet().getLinkStatsTable();

									patchState(store, {
										links: linkTable,
										status: Status.SUCCESS,
									});
								},

								error: (error: HttpErrorResponse) => {
									if (error.status == 404) {
										patchState(store, { status: Status.SUCCESS, error: null });
										return;
									}
									else {
										patchState(store, { status: Status.ERROR, error });
										snackbarService.openSnackBar('Error trying to fetch links', '');
									}
								}
							})
						)
					}),

				)
			),

			createLink: rxMethod<CreateLinkDto>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap((link) => {
						return linkService.createLink(link).pipe(
							tapResponse({
								next: (response) => {
									const linkRow = plainToInstance(PromoterWorkbook, response.data).getLinkStatsSheet().getLinkStatsTable().getRow(0);


									const newLinkStatsTable = new LinkStatsTable();
									const currentLinkStatsTable = store.links();

									if (currentLinkStatsTable) {
										Object.assign(newLinkStatsTable, currentLinkStatsTable);
									} else {
										newLinkStatsTable.rows = new JSONArray();
									}

									newLinkStatsTable.addRow(linkRow);

									patchState(store, { status: Status.SUCCESS, error: null, links: newLinkStatsTable });
									snackbarService.openSnackBar('Successfully created link', '');
								},
								error: (error: HttpErrorResponse) => {
									console.error(error.error);
									patchState(store, { status: Status.ERROR, error })
									snackbarService.openSnackBar('Failed to create link', '');
								}
							})
						)
					})
				)
			),

			deleteLink: rxMethod<{ linkId: string }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(({ linkId }) => {
						return linkService.deleteLink(linkId).pipe(
							tapResponse({
								next: () => {

									const newLinkStatsTable = new LinkStatsTable();

									const rows = store.links()!.getRows();

									for (let i = 0; i < rows.length; i++) {
										const linkStatsRow = new LinkStatsRow(rows[i] as any[]);
										if (linkStatsRow.getLinkId() === linkId) {
											continue;
										}

										if (!newLinkStatsTable.rows) {
											newLinkStatsTable.rows = new JSONArray();
										}

										newLinkStatsTable.addRow(linkStatsRow);
									}

									patchState(store, { status: Status.SUCCESS, error: null, links: newLinkStatsTable.getRows() ? newLinkStatsTable : null });
									snackbarService.openSnackBar('Successfully deleted link', '');
								},
								error: (error: HttpErrorResponse) => {
									console.error(error);
									patchState(store, { status: Status.ERROR, error });
									snackbarService.openSnackBar('Failed to delete link', '');
								}
							})
						)
					})
				)
			),

			copyLinkToClipboard(website: string, link: LinkStatsRow) {
				const fullLinkString = website + '?ref=' + link.getRefVal();
				navigator.clipboard.writeText(fullLinkString);
				snackbarService.openSnackBar('Link Copied!', '');
			},

			setStatus: (status: Status) => {
				patchState(store, { status });
			},

		})
	),
);
