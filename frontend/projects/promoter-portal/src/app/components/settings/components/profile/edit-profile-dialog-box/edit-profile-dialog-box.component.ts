import { Component, computed, effect, inject, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';
import { Status, UpdateMemberDto } from '@org.quicko.cliq/ngx-core';
import { MatButtonModule } from '@angular/material/button';
import { MemberStore } from '../../../../../store/member.store';
import { RxFormBuilder } from '@rxweb/reactive-form-validators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProgramStore } from '../../../../../store/program.store';
import { FormDialogBoxComponent } from '../../../../common/form-dialog-box/form-dialog-box.component';

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
	templateUrl: './edit-profile-dialog-box.component.html',
	styleUrl: './edit-profile-dialog-box.component.css'
})
export class EditProfileDialogBoxComponent implements OnInit, OnDestroy {

	destroy$ = new Subject<boolean>();

	refValUniqueCode: string;

	readonly memberStore = inject(MemberStore);
	readonly programStore = inject(ProgramStore);

	readonly programId = computed(() => this.programStore.program()!.programId);
	readonly member = computed(() => this.memberStore.member());

	profileDetails: UpdateMemberDto;

	editProfileForm: FormGroup;

	hideCurrentPassword: boolean = true;

	hideNewPassword: boolean = true;

	error = computed(() => this.memberStore.error());

	isLoading = computed(() => this.memberStore.status() === Status.LOADING);

	constructor(
		private fb: RxFormBuilder,
		private dialogRef: MatDialogRef<EditProfileDialogBoxComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any,
	) {
		effect(() => {
			this.profileDetails = new UpdateMemberDto();
			this.profileDetails.email = this.member()?.email ?? '';
			this.profileDetails.firstName = this.member()?.firstName ?? '';
			this.profileDetails.lastName = this.member()?.lastName ?? '';

			this.editProfileForm = this.fb.formGroup(this.profileDetails);

			this.editProfileForm.addValidators(this.passwordMatchValidator);
		});
	}

	closeDialog(): void {
		this.dialogRef.close();
	}

	ngOnInit(): void {

	}

	ngOnDestroy(): void {
		this.destroy$.next(true);
		this.destroy$.complete();
	}

	onSubmit = () => {
		if (this.editProfileForm.valid) {
			this.memberStore.updateMemberInfo({
				updatedInfo: this.profileDetails,
				programId: this.programId()
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
