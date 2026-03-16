import { Component, computed, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { AbilityServiceSignal } from '@casl/angular';

import {
	UserDto,
	Status,
	userRoleEnum,
	UpdateUserRoleDto,
	UpdateProgramUserDto,
	UpdateUserDto,
	OrdinalDatePipe
} from '@org.quicko.cliq/ngx-core';

import { ProgramStore } from '../../../../store/program.store';
import { TeamStore, onAddUserSuccess, onRemoveUserSuccess } from './store/team.store';
import { AddEditUserDialogComponent } from './components/add-edit-user-dialog/add-edit-user-dialog.component';
import { InfoDialogBoxComponent } from '../../../common/info-dialog-box/info-dialog-box.component';
import { NotAllowedDialogBoxComponent } from '../../../common/not-allowed-dialog-box/not-allowed-dialog-box.component';
import { UserAbility } from '../../../../permissions/ability';

@Component({
	selector: 'app-team',
	imports: [
		CommonModule,
		MatTableModule,
		MatPaginatorModule,
		MatMenuModule,
		MatIconModule,
		MatButtonModule,
		MatDialogModule,
		MatDividerModule,
		TitleCasePipe,
		OrdinalDatePipe,
	],
	providers: [TeamStore],
	templateUrl: './team.component.html',
	styleUrl: './team.component.css'
})
export class TeamComponent implements OnInit {

	displayedColumns: string[] = ['name', 'email', 'role', 'joinedOn', 'menu'];

	readonly teamStore = inject(TeamStore);
	readonly programStore = inject(ProgramStore);
	readonly dialog = inject(MatDialog);

	readonly programId = computed(() => this.programStore.program()!.programId);
	readonly isLoading = computed(() => this.teamStore.status() === Status.LOADING);

	private readonly abilityService = inject<AbilityServiceSignal<UserAbility>>(AbilityServiceSignal);
	protected readonly can = this.abilityService.can;

	userRoles = [userRoleEnum.ADMIN, userRoleEnum.EDITOR, userRoleEnum.VIEWER];

	pagination = signal({
		pageIndex: 0,
		pageSize: 10,
	});

	dataSource = new MatTableDataSource<UserDto>([]);

	@ViewChild(MatPaginator) paginator: MatPaginator;

	readonly totalDataLength = computed(() => this.teamStore.users()?.length ?? 0);

	constructor() {
		effect(() => {
			const users = this.teamStore.users();
			if (users) {
				this.dataSource.data = users;
			}
		});

		onAddUserSuccess.subscribe(() => {
			this.loadUsers();
		});

		onRemoveUserSuccess.subscribe(() => {
			this.loadUsers();
		});
	}

	ngOnInit(): void {
		this.loadUsers();
	}

	loadUsers() {
		const { pageIndex, pageSize } = this.pagination();

		this.teamStore.fetchUsers({
			programId: this.programId(),
			skip: pageIndex * pageSize,
			take: pageSize,
		});
	}

	onPageChange(event: PageEvent) {
		this.pagination.set({
			pageIndex: event.pageIndex,
			pageSize: event.pageSize,
		});

		this.loadUsers();
	}

	openNotAllowedDialogBox(description: string) {
		this.dialog.open(NotAllowedDialogBoxComponent, {
			data: { description }
		});
	}

	onAddUser() {

		if (!this.can('invite_user', UpdateUserRoleDto)) {
			this.openNotAllowedDialogBox('You do not have permission to add a user.');
			return;
		}

		this.teamStore.setStatus(Status.PENDING);

		this.dialog.open(AddEditUserDialogComponent, {
			data: {
				addUser: this.addUser,
				status: this.teamStore.status,
			}
		});
	}

	addUser = (newUser: any) => {
		this.teamStore.inviteUser({
			programId: this.programId(),
			body: newUser,
		});
	}

	onEdit(user: UserDto) {

		if (!this.can('change_role', UpdateUserRoleDto)) {
			this.openNotAllowedDialogBox('You do not have permission to edit a user.');
			return;
		}

		if (user.role === userRoleEnum.SUPER_ADMIN) {
			this.openNotAllowedDialogBox('Cannot modify a super admin user.');
			return;
		}

		this.dialog.open(AddEditUserDialogComponent, {
			data: {
				user,
				editUser: ({ role, email, firstName, lastName }: { role: userRoleEnum, email: string, firstName: string, lastName: string }) => {
					if (role !== user.role) {
						const updatedRole = new UpdateUserRoleDto();
						updatedRole.role = role;
						this.teamStore.updateUserRole({
							programId: this.programId(),
							userId: user.userId,
							body: updatedRole,
						});
					}

					if (email !== user.email || firstName !== user.firstName || lastName !== user.lastName) {
						const userInfo = new UpdateUserDto();
						userInfo.email = email;
						userInfo.firstName = firstName;
						userInfo.lastName = lastName;
						this.teamStore.updateUserInfo({
							userId: user.userId,
							body: userInfo,
						});
					}
				},
				status: this.teamStore.status,
			}
		});
	}

	onRemove(user: UserDto) {

		if (!this.can('remove_user', UpdateUserRoleDto)) {
			this.openNotAllowedDialogBox('You do not have permission to remove a user.');
			return;
		}

		if (user.role === userRoleEnum.SUPER_ADMIN) {
			this.openNotAllowedDialogBox('Cannot modify a super admin user.');
			return;
		}

		this.dialog.open(InfoDialogBoxComponent, {
			data: {
				title: `Remove ${user.firstName} ${user.lastName}?`,
				message: `Are you sure you want to remove ${user.firstName} ${user.lastName} from this program? They will lose all access.`,
				confirmButtonText: 'Remove',
				cancelButtonText: 'Cancel',
				onSubmit: () => {
					this.teamStore.removeUser({
						programId: this.programId(),
						userId: user.userId,
					});
				}
			}
		});
	}
}