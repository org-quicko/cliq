import { withDevtools } from "@angular-architects/ngrx-toolkit";
import { EventEmitter, inject } from "@angular/core";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { CreateMemberDto, memberSortByEnum, sortOrderEnum, Status, UpdatePromoterMemberDto } from "@org.quicko.cliq/ngx-core";
import { MemberRow, MemberTable, PromoterWorkbook } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { PromoterService } from "../../../../../services/promoter.service";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { of, pipe, switchMap, tap } from "rxjs";
import { tapResponse } from "@ngrx/operators";
import { HttpErrorResponse, } from '@angular/common/http';
import { JSONArray } from "@org-quicko/core";
import { SnackbarService } from "@org.quicko.cliq/ngx-core";
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

export const onAddMemberSuccess: EventEmitter<void> = new EventEmitter();
export const onRemoveMemberSuccess: EventEmitter<void> = new EventEmitter();


export const TeamStore = signalStore(
	withState(initialTeamState),
	withDevtools('team'),
	withMethods(
		(
			store,
			promoterService = inject(PromoterService),
			snackBarService = inject(SnackbarService)
		) => ({

			getAllMembers: rxMethod<{ sortOrder?: sortOrderEnum, sortBy?: memberSortByEnum, skip?: number, take?: number, isSorting?: boolean, programId: string, promoterId: string }>(
				pipe(
					tap(({ isSorting }) => {
						if (!isSorting) {
							patchState(store, { status: Status.LOADING });
						}
					}),

					switchMap(({ sortBy, sortOrder, skip, take, isSorting, programId, promoterId, }) => {

						const page = Math.floor((skip ?? 0) / (take ?? 5));

						if (!isSorting && store.loadedPages().has(page)) {
							patchState(store, { status: Status.SUCCESS });
							return of(store.members()); // ✅ skip request if page already loaded
						}

						return promoterService.getAllMembers(programId, promoterId, { sort_by: sortBy, sort_order: sortOrder, skip, take }).pipe(
							tapResponse({
								next(response) {
									const memberTable = plainToInstance(PromoterWorkbook, response.data).getMemberSheet().getMemberTable();
									const metadata = memberTable.getMetadata();

									let currentMemberTable = store.members();

									const updatedPages = store.loadedPages().add(page);
									let updatedMemberTable: MemberTable;

									// append entries in case new entries incoming
									if (currentMemberTable && !isSorting) {
										const rows = memberTable.getRows();
										for (const row of rows) {
											const member = new MemberRow(row as any[]);
											currentMemberTable.addRow(member);
										}

										updatedMemberTable = Object.assign(new MemberTable(), currentMemberTable);
										updatedMemberTable.setMetadata(metadata);
									} else {
										updatedMemberTable = memberTable;
									}


									patchState(store, {
										members: updatedMemberTable,
										error: null,
										status: Status.SUCCESS,
										loadedPages: updatedPages,
									});
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
				patchState(store, { loadedPages: new Set() });
			},

			resetMembers() {
				patchState(store, { members: null });
			},

			addMember: rxMethod<{ addedMember:CreateMemberDto, programId: string, promoterId: string }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(({ addedMember, programId, promoterId, }) => {
						return promoterService.addMember(programId, promoterId, addedMember).pipe(
							tapResponse({
								next(response) {

									patchState(store, { status: Status.SUCCESS, error: null });
									onAddMemberSuccess.emit();
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

			removeMember: rxMethod<{ memberId: string, programId: string, promoterId: string }>(
				pipe(
					tap(() => patchState(store, { status: Status.LOADING })),

					switchMap(({ memberId, programId, promoterId, }) => {
						return promoterService.removeMember(programId, promoterId, memberId).pipe(
							tapResponse({
								next() {
									patchState(store, { status: Status.SUCCESS, error: null });
									onRemoveMemberSuccess.emit();
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

			updateMemberRole: rxMethod<{ memberId: string, updatedInfo: UpdatePromoterMemberDto, programId: string, promoterId: string }>(
				pipe(
					switchMap(({ memberId, updatedInfo, programId, promoterId, }) => {
						return promoterService.updateMemberRole(programId, promoterId, memberId, updatedInfo).pipe(
							tapResponse({
								next(response) {
									const currentMemberTable = store.members()!;
									const metadata = currentMemberTable.getMetadata();

									const updatedMemberTable = new MemberTable();
									updatedMemberTable.setMetadata(metadata);

									const rows = currentMemberTable.getRows();

									for (let i = 0; i < rows.length; i++) {
										const memberRow = new MemberRow(rows[i] as any[]);

										if (memberRow.getMemberId() === memberId) {
											const updatedMember = Object.assign(new MemberRow([]), memberRow);
											updatedMember.setRole(updatedInfo.role!);

											updatedMemberTable.addRow(updatedMember);
										} else {
											updatedMemberTable.addRow(memberRow);
										}

									}

									patchState(store, { status: Status.SUCCESS, error: null, members: updatedMemberTable });
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
