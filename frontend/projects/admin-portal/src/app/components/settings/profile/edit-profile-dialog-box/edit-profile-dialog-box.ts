import { Component, computed, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';
import { Status, UpdateUserDto } from '@org.quicko.cliq/ngx-core';
import { MatButtonModule } from '@angular/material/button';
import { UserStore } from '../../../../store/user.store';
import { RxFormBuilder } from '@rxweb/reactive-form-validators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormDialogBoxComponent } from '../../../common/form-dialog-box/form-dialog-box.component';
import { Inject } from '@angular/core';
import { AuthService } from '../../../../services/auth.service';

@Component({
	selector: 'app-edit-profile-dialog-box',
	imports: [
		MatDialogModule,
		ReactiveFormsModule,
		FormsModule,
		MatFormFieldModule,
		MatIconModule,
		MatButtonModule,
		MatInputModule,
		MatProgressSpinnerModule,
		MatError,
		FormDialogBoxComponent
	],
	templateUrl: './edit-profile-dialog-box.html',
	styleUrl: './edit-profile-dialog-box.css'
})
export class EditProfileDialogBoxComponent implements OnDestroy {

	destroy$ = new Subject<boolean>();

	readonly userStore = inject(UserStore);
	readonly authService = inject(AuthService);

	readonly user = computed(() => this.userStore.user());
	readonly userId = computed(() => this.authService.getUserId());

	profileDetails: UpdateUserDto;

	editProfileForm: FormGroup;

	hideCurrentPassword: boolean = true;

	hideNewPassword: boolean = true;

	error = computed(() => this.userStore.error());

	isLoading = computed(() => this.userStore.status() === Status.LOADING);

	constructor(
		private fb: RxFormBuilder,
		private dialogRef: MatDialogRef<EditProfileDialogBoxComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any,
	) {
		effect(() => {
			this.profileDetails = new UpdateUserDto();
			this.profileDetails.email = this.user()?.email ?? '';
			this.profileDetails.firstName = this.user()?.firstName ?? '';
			this.profileDetails.lastName = this.user()?.lastName ?? '';

			this.editProfileForm = this.fb.formGroup(this.profileDetails);

			this.editProfileForm.addValidators(this.passwordMatchValidator);
		});
	}

	closeDialog(): void {
		this.dialogRef.close();
	}

	ngOnDestroy(): void {
		this.destroy$.next(true);
		this.destroy$.complete();
	}

	onSubmit = () => {
		if (this.editProfileForm.valid) {
			this.userStore.updateUserInfo({
				updatedInfo: this.profileDetails,
				userId: this.userId()!
			});

			this.closeDialog();
		}
	}

	passwordMatchValidator = (): { [key: string]: boolean } | null => {
		const currentPassword = this.editProfileForm?.get('currentPassword')?.value;
		const newPassword = this.editProfileForm?.get('newPassword')?.value;

		if (currentPassword || newPassword) {
			if (!currentPassword || !newPassword) {
				return { passwordsRequired: true };
			}

			if (currentPassword === newPassword) {
				return { passwordsMatch: true };
			}
		}

		return null;
	};
}
