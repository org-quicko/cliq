import { EventEmitter, inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { of, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
// import { CreateLinkDto, LinkDto, LinkStatsTable, PromoterWorkbook, SnackbarService, Status } from '@org.quicko.cliq/ngx-core';
import { LinkService } from '../../../../../services/link.service';
import { plainToInstance } from 'class-transformer';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { Status, CreateLinkDto, PaginationOptions, sortOrderEnum, linkSortByEnum, SnackbarService } from '@org.quicko.cliq/ngx-core';
import {  } from '@org.quicko.cliq/generated/sources/Promoter';
import { HttpErrorResponse } from '@angular/common/http';
import { PromoterService } from '../../../../../services/promoter.service';

export interface DashboardStoreState {
	links: Partial<{
		links: LinkAnalyticsTable | null;
		error: any | null;
		status: Status;
		loadedPages: Set<number>;
	}>;
	analytics: Partial<{
		analytics: PromoterAnalyticsTable | null;
		error: any | null;
		status: Status;
	}>;
}


export const initialDashboardState: DashboardStoreState = {
	links: {
		links: null,
		error: null,
		status: Status.PENDING,
		loadedPages: new Set<number>(),
	},
	analytics: {
		analytics: null,
		error: null,
		status: Status.PENDING,
	},
};


export const onCreateLinkSuccess: EventEmitter<void> = new EventEmitter();
export const onDeleteLinkSuccess: EventEmitter<void> = new EventEmitter();

export const DashboardStore = signalStore(
	withState(initialDashboardState),
	withDevtools('dashboard'),
	withMethods(
		(
			store,
			linkService = inject(LinkService),
			promoterService = inject(PromoterService),
			snackbarService = inject(SnackbarService),
		) => ({

			getPromoterLinks: rxMethod<{
				sortOrder?: sortOrderEnum,
				sortBy?: linkSortByEnum,
				skip?: number,
				take?: number,
				isSorting: boolean,

				programId: string,
				promoterId: string,
			}>(
				pipe(

					tap(({ isSorting }) => {
						if (!isSorting) {
							patchState(store, {
								links: {
									...store.links(),
									status: Status.LOADING,
								}
							});
						}
					}),

					switchMap(({ sortBy, sortOrder, skip, take, programId, promoterId, isSorting }) => {

						const page = Math.floor((skip ?? 0) / (take ?? 5));

						if (!isSorting && store.links().loadedPages!.has(page)) {
							patchState(store, {
								links: {
									...store.links(),
									status: Status.SUCCESS,
								}
							});
							return of(store.links());
						}

						return linkService.getPromoterLinkAnalytics(programId, promoterId, { skip, take, sort_by: sortBy, sort_order: sortOrder }).pipe(
							tapResponse({
								next(response) {
									const linkTable = plainToInstance(PromoterWorkbook, response.data).getLinkAnalyticsSheet().getLinkAnalyticsTable();
									const metadata = linkTable.getMetadata();

									let currentLinkTable = store.links().links;

									const updatedPages = store.links().loadedPages!.add(page);
									let updatedLinkTable: LinkAnalyticsTable;

									if (currentLinkTable && !isSorting) {
										const rows = linkTable.getRows();
										for (const row of rows) {
											const link = new LinkAnalyticsRow(row as any[]);
											currentLinkTable.addRow(link);
										}

										updatedLinkTable = Object.assign(new LinkAnalyticsTable(), currentLinkTable);

										// get the latest metadata from the incoming table
										updatedLinkTable.setMetadata(metadata);
									} else {
										updatedLinkTable = linkTable;
									}


									patchState(store, {
										links: {
											...store.links(),
											links: updatedLinkTable,
											error: null,
											status: Status.SUCCESS,
											loadedPages: updatedPages,
										}
									});
								},

								error(error: HttpErrorResponse) {
									if (error.status == 404) {
										patchState(store, {
											links: {
												...store.links(),
												status: Status.SUCCESS,
												error: null
											}
										});
										return;
									}
									else {
										patchState(store, {
											links: {
												...store.links(),
												status: Status.ERROR,
												error
											}
										});
										snackbarService.openSnackBar('Error trying to fetch links', '');
									}
								}
							})
						)
					}),

				)
			),

			resetLoadedPages() {
				patchState(store, {
					links: {
						...store.links(),
						loadedPages: new Set<number>()
					}
				});
			},

			resetLinks() {
				patchState(store, {
					links: {
						...store.links(),
						links: null,
					}
				});
			},

			createLink: rxMethod<{ link: CreateLinkDto, programId: string, promoterId: string }>(
				pipe(
					switchMap(({ link, programId, promoterId }) => {
						return linkService.createLink(programId, promoterId, link).pipe(
							tapResponse({
								next(response) {
									patchState(store, {
										links: {
											...store.links(),
											status: Status.SUCCESS,
											error: null,
											loadedPages: store.links().loadedPages
										}
									});
									onCreateLinkSuccess.emit();
									snackbarService.openSnackBar('Successfully created link', '');
								},
								error: (error: HttpErrorResponse) => {
									console.error(error);

									patchState(store, {
										links: {
											...store.links(),
											status: Status.ERROR,
											error
										}
									})

									if (error.status == 409) {
										snackbarService.openSnackBar(error.error.message, '');
									} else {
										snackbarService.openSnackBar('Failed to create link', '');
									}
								}
							})
						)
					})
				)
			),

			deleteLink: rxMethod<{ linkId: string, programId: string, promoterId: string }>(
				pipe(
					switchMap(({ linkId, programId, promoterId }) => {
						return linkService.deleteLink(programId, promoterId, linkId).pipe(
							tapResponse({
								next: () => {
									patchState(store, {
										links: {
											...store.links(),
											status: Status.SUCCESS,
											error: null,
										}
									});
									onDeleteLinkSuccess.emit();
									snackbarService.openSnackBar('Successfully deleted link', '');
								},
								error: (error: HttpErrorResponse) => {
									console.error(error);
									patchState(store, {
										links: {
											...store.links(),
											status: Status.ERROR,
											error
										}
									});
									snackbarService.openSnackBar('Failed to delete link', '');
								}
							})
						)
					})
				)
			),

			getPromoterStats: rxMethod<{ programId: string, promoterId: string }>(
				pipe(
					tap(() => patchState(store, {
						analytics: {
							status: Status.LOADING
						}
					})),

					switchMap(({ programId, promoterId }) => {
						return promoterService.getPromoterAnalytics(programId, promoterId).pipe(
							tapResponse({
								next: (response) => {
									patchState(store, {
										analytics: {
											...store.analytics(),
											analytics: plainToInstance(PromoterWorkbook, response.data).getPromoterAnalyticsSheet().getPromoterAnalyticsTable(),
											status: Status.SUCCESS
										},
									});
								},
								error: (error: HttpErrorResponse) => {
									if (error.status == 404) {
										patchState(store, {
											analytics: {
												...store.analytics(),
												status: Status.SUCCESS,
											},
										});
										console.error('No analytics found for this promoter');
									} else {
										patchState(store, {
											analytics: {
												...store.analytics(),
												status: Status.ERROR,
												error
											},
										});
										snackbarService.openSnackBar('Error trying to fetch promoter analytics', '');
									}
								}
							})
						)
					})
				)
			)

		})
	),
);
