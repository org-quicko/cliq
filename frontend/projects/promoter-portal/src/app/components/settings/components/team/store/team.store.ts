import { withDevtools } from "@angular-architects/ngrx-toolkit";
import { inject } from "@angular/core";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { CreateMemberDto, memberSortByEnum, sortOrderEnum, Status, UpdatePromoterMemberDto } from "@org.quicko.cliq/ngx-core";
import { MemberRow, MemberTable, PromoterWorkbook } from "@org.quicko.cliq/ngx-core/generated/sources/Promoter";
import { PromoterService } from "../../../../../services/promoter.service";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { of, pipe, switchMap, tap } from "rxjs";
import { tapResponse } from "@ngrx/operators";
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { JSONArray, SnackbarService } from "@org.quicko/ngx-core";
import { plainToInstance } from "class-transformer";

export interface TeamStoreState {
	members: MemberTable | null;
	error: any;
	status: Status;
	loadedPages: Set<number>;
};

export const initialTeamState: TeamStoreState = {
	members: null,
	error: null,
	status: Status.PENDING,
	loadedPages: new Set<number>()
};


export const TeamStore = signalStore(
	withState(initialTeamState),
	withDevtools('team'),
	withMethods(
		(
			store,
			promoterService = inject(PromoterService),
			snackBarService = inject(SnackbarService)
		) => ({

			getAllMembers: rxMethod<{ sortOrder?: sortOrderEnum, sortBy?: memberSortByEnum, skip?: number, take?: number, isSorting?: boolean }>(
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
							return of(store.members()); // ✅ skip request if page already loaded
						}

						return promoterService.getAllMembers({ sort_by: sortBy, sort_order: sortOrder, skip, take }).pipe(
							tapResponse({
								next(response) {
									const memberTable = plainToInstance(PromoterWorkbook, response.data).getMemberSheet().getMemberTable();

									let currentMemberTable = store.members();

									const updatedPages = store.loadedPages().add(page);

									// append entries in case new entries incoming
									if (currentMemberTable && !isSorting) {
										const rows = memberTable.getRows();
										for (const row of rows) {
											const member = new MemberRow(row as any[]);
											currentMemberTable.addRow(member);
										}

									} else {
										currentMemberTable = memberTable;
									}

									const updatedMemberTable = Object.assign(new MemberTable(), currentMemberTable);

									patchState(store, { status: Status.SUCCESS, members: updatedMemberTable, loadedPages: updatedPages });
								},
								error(error: HttpErrorResponse) {
									if (error.status == 404) {
										patchState(store, { status: Status.SUCCESS, members: new MemberTable() })
									} else {
										patchState(store, { status: Status.ERROR, error });
										snackBarService.openSnackBar('Failed to fetch members for promoter', '');
									}
								},
							})
						)
					})
				)
			),

			resetLoadedPages() {
				patchState(store, { loadedPages: new Set(), members: null });
			},

			addMember: rxMethod<CreateMemberDto>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap((addedMember) => {
						return promoterService.addMember(addedMember).pipe(
							tapResponse({
								next(response) {
									const memberRow = plainToInstance(PromoterWorkbook, response.data).getMemberSheet().getMemberTable().getRow(0);

									const newMemberTable = new MemberTable();

									Object.assign(newMemberTable, store.members());
									newMemberTable.addRow(memberRow);

									patchState(store, { status: Status.SUCCESS, members: newMemberTable, error: null });
									snackBarService.openSnackBar('Successfully added member!', '');
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar('Failed to add member', '');
								},
							})
						)
					})
				)
			),

			removeMember: rxMethod<{ memberId: string }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(({ memberId }) => {
						return promoterService.removeMember(memberId).pipe(
							tapResponse({
								next() {
									const newMemberTable = new MemberTable();

									const rows = store.members()!.getRows();

									for (let i = 0; i < rows.length; i++) {
										const memberRow = new MemberRow(rows[i] as any[]);
										if (memberRow.getMemberId() === memberId) {
											continue;
										}

										if (!newMemberTable.rows) {
											newMemberTable.rows = new JSONArray();
										}

										newMemberTable.addRow(memberRow);
									}

									patchState(store, { status: Status.SUCCESS, error: null, members: newMemberTable.getRows() ? newMemberTable : null });
									snackBarService.openSnackBar('Successfully removed member!', '');
								},
								error(error: HttpErrorResponse) {
									patchState(store, { status: Status.ERROR, error });
									snackBarService.openSnackBar('Failed to remove member', '');
								},
							})
						)
					})
				)
			),

			updateMemberRole: rxMethod<{ memberId: string, updatedInfo: UpdatePromoterMemberDto }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(({ memberId, updatedInfo }) => {
						return promoterService.updateMemberRole(memberId, updatedInfo).pipe(
							tapResponse({
								next(response) {
									const newMemberTable = new MemberTable();

									const rows = store.members()!.getRows();

									for (let i = 0; i < rows.length; i++) {
										if (!newMemberTable.rows) {
											newMemberTable.rows = new JSONArray();
										}

										const memberRow = new MemberRow(rows[i] as any[]);

										if (memberRow.getMemberId() === memberId) {
											const updatedMember = new MemberRow([]);

											Object.assign(updatedMember, memberRow);
											updatedMember.setRole(updatedInfo.role!);

											newMemberTable.addRow(updatedMember);
											continue;
										}

										newMemberTable.addRow(memberRow);
									}

									patchState(store, { status: Status.SUCCESS, error: null, members: newMemberTable });
									snackBarService.openSnackBar(`Changed member role to ${updatedInfo.role}`, '');
								},
								error(error: Error) {
									if (error instanceof HttpErrorResponse) {
										patchState(store, { status: Status.ERROR, error });
										snackBarService.openSnackBar('Failed to remove member', '');
									} else {
										patchState(store, { status: Status.ERROR, error });
										snackBarService.openSnackBar('Something went wrong', '');
									}
								},
							})
						)
					})
				)
			),

			setStatus(status: Status, error: any = null) {
				if (status === Status.ERROR) {
					if (!error) {
						console.error('Must pass error object on an error status state.');
						throw new Error('Must pass error object on an error status state.');
					}

					patchState(store, { status, error });
				}

				patchState(store, { status });
			}

		})
	)
);
