import { Component, inject, Inject, OnDestroy, OnInit, Signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { CreateUserDto, Status, UserDto, userRoleEnum } from '@org.quicko.cliq/ngx-core';
import { RxFormBuilder } from '@rxweb/reactive-form-validators';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, catchError, of } from 'rxjs';
import { FormDialogBoxComponent } from '../../../../common/form-dialog-box/form-dialog-box.component';
import { TitleCasePipe } from '@angular/common';
import { onAddUserSuccess } from '../../../store/team.store';
import { FormControl, Validators } from '@angular/forms';
import { UserService } from '../../../../../services/user.service';

@Component({
	selector: 'app-add-edit-user-dialog',
	imports: [
		MatDialogModule,
		ReactiveFormsModule,
		FormsModule,
		MatFormFieldModule,
		MatIconModule,
		MatButtonModule,
		MatInputModule,
		MatSelectModule,
		MatAutocompleteModule,
		FormDialogBoxComponent,
		TitleCasePipe,
	],
	templateUrl: './add-edit-user-dialog.component.html',
	styleUrl: './add-edit-user-dialog.component.css'
})
export class AddEditUserDialogComponent implements OnInit, OnDestroy {

	destroy$ = new Subject<boolean>();

	newUser: CreateUserDto;
	addUserForm: FormGroup;
	roles = [userRoleEnum.ADMIN, userRoleEnum.EDITOR, userRoleEnum.VIEWER];
	hidePassword = true;
	isEditMode = false;

	existingUser: UserDto | null = null;
	emailSuggestions: UserDto[] = [];

	private readonly userService = inject(UserService);

	constructor(
		private fb: RxFormBuilder,
		@Inject(MAT_DIALOG_DATA) public data: {
			addUser?: Function,
			editUser?: Function,
			status: Signal<Status>,
			user?: any,
		},
		private dialogRef: MatDialogRef<AddEditUserDialogComponent>
	) {
		this.isEditMode = !!data?.user;

		this.newUser = new CreateUserDto();
		this.addUserForm = this.fb.formGroup(this.newUser);

		this.addUserForm.addControl('role', new FormControl('', Validators.required));

		if (this.isEditMode) {
			this.addUserForm.patchValue({
				email: data.user.email ?? '',
				firstName: data.user.firstName ?? '',
				lastName: data.user.lastName ?? '',
				role: data.user.role,
			});
			this.addUserForm.get('password')?.disable();
		}

		onAddUserSuccess.subscribe(() => {
			this.closeDialog();
		});
	}

	ngOnInit(): void {
		if (!this.isEditMode) {
			this.addUserForm.get('email')!.valueChanges.pipe(
				takeUntil(this.destroy$),
				debounceTime(400),
				distinctUntilChanged(),
			).subscribe((value: string) => {
				if (!value || value.length < 3) {
					this.emailSuggestions = [];
					this.clearExistingUser();
					return;
				}

				this.userService.searchUsersByEmail(value).pipe(
					catchError(() => of(null))
				).subscribe((response) => {
					if (response?.data?.length) {
						this.emailSuggestions = response.data;
					} else {
						this.emailSuggestions = [];
						this.clearExistingUser();
					}
				});
			});
		}
	}

	onEmailSelected(event: MatAutocompleteSelectedEvent) {
		const user = event.option.value as UserDto;
		this.existingUser = user;
		this.addUserForm.get('email')!.setValue(user.email);
		this.addUserForm.get('firstName')?.disable();
		this.addUserForm.get('lastName')?.disable();
		this.addUserForm.get('password')?.disable();
	}

	displayEmail(user: UserDto | string): string {
		return typeof user === 'string' ? user : user?.email ?? '';
	}

	private clearExistingUser() {
		if (this.existingUser) {
			this.existingUser = null;
			this.addUserForm.get('firstName')?.enable();
			this.addUserForm.get('lastName')?.enable();
			this.addUserForm.get('password')?.enable();
		}
	}

	onSubmit = () => {
		if (this.isEditMode) {
			const roleControl = this.addUserForm.get('role');
			const emailControl = this.addUserForm.get('email');
			const firstNameControl = this.addUserForm.get('firstName');
			const lastNameControl = this.addUserForm.get('lastName');
			if (this.addUserForm.valid && roleControl?.value && this.data.editUser) {
				this.data.editUser({
					role: roleControl.value,
					email: emailControl?.value ?? '',
					firstName: firstNameControl?.value ?? '',
					lastName: lastNameControl?.value ?? '',
				});
				this.closeDialog();
			}
			return;
		}

		if (this.addUserForm.valid && this.data.addUser) {
			this.newUser.role = this.addUserForm.get('role')?.value;
			if (this.existingUser) {
				this.newUser.email = this.existingUser.email;
				this.newUser.firstName = this.existingUser.firstName;
				this.newUser.lastName = this.existingUser.lastName;
				this.newUser.password = '';
			}
			this.data.addUser(this.newUser);
		}
	}

	closeDialog() {
		this.dialogRef.close();
	}

	ngOnDestroy(): void {
		this.destroy$.next(true);
		this.destroy$.complete();
	}
}
