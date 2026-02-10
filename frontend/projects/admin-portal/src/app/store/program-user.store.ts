import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { ProgramService } from '../services/program.service';
import { PermissionsService } from '../services/permission.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { ProgramDto, ProgramUserDto, Status, userRoleEnum } from '@org.quicko.cliq/ngx-core';

export interface ProgramWithRole extends ProgramDto {
	role?: userRoleEnum | string;
}

type ProgramUserStoreState = {
	programs: ProgramWithRole[];
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
		(store, programService = inject(ProgramService), permissionsService = inject(PermissionsService)) => ({
			fetchPrograms: rxMethod<void>(
				pipe(
					tap(() => {
						patchState(store, {
							status: Status.PENDING,
							isLoading: true,
						});
					}),
					switchMap(() => {
						// Check if user is super admin using CASL permissions
						if (permissionsService.isSuperAdmin()) {
							// Super admin: fetch program summary
							return programService.getProgramSummary({ take: 100 }).pipe(
								tap((summaryResponse) => {
									let superAdminPrograms: ProgramWithRole[] = [];
									
									if (summaryResponse.data) {
										const workbook = summaryResponse.data;
										const sheet = workbook?.sheets?.[0];
										const table = sheet?.blocks?.[0];
										const rows = table?.rows || [];
										
										superAdminPrograms = rows.map((row: any[]) => ({
											programId: row[0],
											name: row[1],
											role: userRoleEnum.SUPER_ADMIN
										} as ProgramWithRole));
									}
									
									patchState(store, { 
										programs: superAdminPrograms,
										status: Status.SUCCESS,
										isLoading: false,
										isSuperAdmin: true
									});
								}),
								catchError((error) => {
									console.error('[ProgramUserStore] Error fetching program summary:', error);
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
							// Regular user: fetch programs with role from ProgramUser
							return programService.getAllPrograms().pipe(
								tap((response) => {
									// Backend returns programs with role from ProgramUser
									// Handle both camelCase (programId) and snake_case (program_id) from backend
									const programsWithRole: ProgramWithRole[] = (response.data || []).map((program: any) => ({
										programId: program.programId || program.program_id,
										name: program.name,
										role: program.role || null
									}));
									patchState(store, { 
										programs: programsWithRole,
										status: Status.SUCCESS,
										isLoading: false,
										isSuperAdmin: false
									});
								}),
								catchError((error) => {
									console.error('[ProgramUserStore] Error fetching programs:', error);
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
						console.error('[ProgramUserStore] Error:', error);
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
							userId: '',
							role: program.role as userRoleEnum,
							status: 'active' as any,
							createdAt: new Date(),
							updatedAt: new Date(),
						}
					});
				}
			},

			resetStore() {
				patchState(store, initialState);
			},
		})
	)
);
