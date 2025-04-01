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

									patchState(store, {
										links: plainToInstance(PromoterWorkbook, response.data).getLinkStatsSheet().getLinkStatsTable(),
										status: Status.SUCCESS,
										// skip: store.skip() +
									});
								},

								error: (err) => {
									patchState(store, { status: Status.ERROR, error: err });
									snackbarService.openSnackBar('Error trying to fetch links', '');
								}
							})
						)
					}),

					// shareReplay()
				)
			),

			createLink: rxMethod<CreateLinkDto>(
				pipe(
					// tap(() => patchState(store, { status:  }))
					switchMap((link) => {
						return linkService.createLink(link).pipe(
							tapResponse({
								next: (link) => {
									console.log(link);
								},
								error: (err) => {
									patchState(store, { status: Status.ERROR, error: err })
								}
							})
						)
					})
				)
			),

			deleteLink: rxMethod<{ linkId: string }>(
				pipe(
					// tap(() => patchState(store, { status:  }))
					switchMap(({ linkId }) => {
						return linkService.deleteLink(linkId).pipe(
							tapResponse({
								next: () => {
									snackbarService.openSnackBar('Deleted link', '');
								},
								error: (err) => {
									patchState(store, { status: Status.ERROR, error: err })
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
