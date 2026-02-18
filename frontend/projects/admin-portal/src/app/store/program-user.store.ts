import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { ProgramService } from '../services/program.service';
import { AuthService } from '../services/auth.service';
import { PermissionsService } from '../services/permission.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { statusEnum, ProgramUserDto, Status, userRoleEnum } from '@org.quicko.cliq/ngx-core';
import { plainToInstance } from 'class-transformer';
import { ProgramSummaryViewWorkbook } from '@org-quicko/cliq-sheet-core/ProgramSummaryView/beans';

type ProgramUserStoreState = {
	programs: ProgramUserDto[];
	currentProgramUser: ProgramUserDto | null;
	status: Status;
	isLoading: boolean;
	isSuperAdmin: boolean;
	error: string | null;
};

const initialState: ProgramUserStoreState = {
	programs: [],
	currentProgramUser: null,
	status: Status.PENDING,
	isLoading: false,
	isSuperAdmin: false,
	error: null,
};

export const ProgramUserStore = signalStore(
	{ providedIn: 'root' },
	withDevtools('program_user'),
	withState(initialState),

	withComputed((store) => ({
		role: computed(() => store.currentProgramUser()?.role ?? null),
		isAdmin: computed(() => store.currentProgramUser()?.role === userRoleEnum.ADMIN),
		isEditor: computed(() => store.currentProgramUser()?.role === userRoleEnum.EDITOR),
		isViewer: computed(() => store.currentProgramUser()?.role === userRoleEnum.VIEWER),
	})),

	withMethods(
		(store, programService = inject(ProgramService), authService = inject(AuthService), permissionsService = inject(PermissionsService)) => ({
			fetchPrograms: rxMethod<void>(
				pipe(
					tap(() => {
						
							patchState(store, {
								status: Status.PENDING,
								isLoading: true,
							});
						
					}),
					switchMap(() => {
					const userRole = permissionsService.userRole();
					if (userRole === userRoleEnum.SUPER_ADMIN) {
							return programService.getProgramSummary().pipe(
								tap((summaryResponse) => {
							let superAdminPrograms: ProgramUserDto[] = [];
							
							if (summaryResponse.data) {
								const workbook = plainToInstance(ProgramSummaryViewWorkbook, summaryResponse.data);
								const sheet = workbook.getProgramSummaryViewSheet();
								const table = sheet.getProgramSummaryViewTable();
								const rows = table.getRows();
								
								for (let i = 0; i < rows.length; i++) {
									const row = table.getRow(i);
									superAdminPrograms.push({
										programId: row.getProgramId(),
										userId: '',
										name: row.getProgramName(),
										role: userRoleEnum.SUPER_ADMIN,
										status: statusEnum.ACTIVE,
										createdAt: new Date(),
										updatedAt: new Date()
									} as ProgramUserDto);
								}
						}
						
						patchState(store, { 
							programs: superAdminPrograms,
							status: Status.SUCCESS,
							isLoading: false,
							isSuperAdmin: true
						});
					}),
					catchError((error) => {
						patchState(store, { 
							error: error.message, 
							status: Status.ERROR,
							isLoading: false,
							programs: []
						});
						return of(null);
					})
				);
			} else {
				return programService.getAllPrograms().pipe(
					tap((response) => {
						const programs: ProgramUserDto[] = (response.data || []).map((programUser: any) => ({
							programId: programUser.programId || programUser.program_id,
							userId: programUser.userId || programUser.user_id || '',
							name: programUser.name || programUser.program?.name || '',
							role: programUser.role,
							status: programUser.status || statusEnum.ACTIVE,
							createdAt: programUser.createdAt ? new Date(programUser.createdAt) : new Date(),
							updatedAt: programUser.updatedAt ? new Date(programUser.updatedAt) : new Date()
						} as ProgramUserDto));
						patchState(store, { 
							programs: programs,
							status: Status.SUCCESS,
							isLoading: false,
							isSuperAdmin: false
						});
					}),
					catchError((error) => {
						patchState(store, { 
							error: error.message, 
							status: Status.ERROR,
							isLoading: false,
							programs: []
						});
						return of(null);
					})
				);
			}
		}),
					catchError((error) => {

						patchState(store, { 
							error: error.message, 
							status: Status.ERROR,
							isLoading: false,
							programs: []
						});
						return of(null);
					})
				)
			),

			setCurrentProgramUser(programUser: ProgramUserDto | null) {
				patchState(store, { currentProgramUser: programUser });
			},

			setRoleFromProgram(programId: string) {
				const programs = store.programs();
				const program = programs.find(p => p.programId === programId);
				if (program?.role) {
					patchState(store, {
						currentProgramUser: {
							programId,
							userId: program.userId || '',
							name: program.name || '',
							role: program.role as userRoleEnum,
							status: program.status || statusEnum.ACTIVE,
							createdAt: program.createdAt || new Date(),
							updatedAt: program.updatedAt || new Date(),
						},
					});
				}
			},
		})
	)
);
