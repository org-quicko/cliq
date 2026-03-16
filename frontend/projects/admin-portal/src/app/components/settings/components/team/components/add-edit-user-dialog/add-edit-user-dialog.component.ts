import { Component, inject, Inject, OnDestroy, Signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CreateUserDto, Status, userRoleEnum } from '@org.quicko.cliq/ngx-core';
import { RxFormBuilder } from '@rxweb/reactive-form-validators';
import { Subject } from 'rxjs';
import { FormDialogBoxComponent } from '../../../../../common/form-dialog-box/form-dialog-box.component';
import { TitleCasePipe } from '@angular/common';
import { onAddUserSuccess } from '../../store/team.store';
import { FormControl, Validators } from '@angular/forms';

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
		FormDialogBoxComponent,
		TitleCasePipe,
	],
	templateUrl: './add-edit-user-dialog.component.html',
	styleUrl: './add-edit-user-dialog.component.css'
})
export class AddEditUserDialogComponent implements OnDestroy {

	destroy$ = new Subject<boolean>();

	newUser: CreateUserDto;
	addUserForm: FormGroup;
	roles = [userRoleEnum.ADMIN, userRoleEnum.EDITOR, userRoleEnum.VIEWER];
	hidePassword = true;
	isEditMode = false;

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
