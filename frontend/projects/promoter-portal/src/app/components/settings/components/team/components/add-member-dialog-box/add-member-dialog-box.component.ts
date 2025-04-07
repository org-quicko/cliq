import { TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, Inject, OnDestroy, Signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CreateMemberDto, memberRoleEnum, Status } from '@org.quicko.cliq/ngx-core';
import { RxFormBuilder } from '@rxweb/reactive-form-validators';
import { Subject } from 'rxjs';
import { MemberAddedSuccessDialogBoxComponent } from '../member-added-success-dialog-box/member-added-success-dialog-box.component';
import { MatButtonModule } from '@angular/material/button';
import { TeamStore } from '../../store/team.store';

@Component({
	selector: 'app-add-member-dialog-box',
	imports: [
		MatDialogModule,
		ReactiveFormsModule,
		FormsModule,
		MatFormFieldModule,
		MatIconModule,
		MatButtonModule,
		MatSelectModule,
		MatInputModule,
		TitleCasePipe,
		MemberAddedSuccessDialogBoxComponent
	],
	templateUrl: './add-member-dialog-box.component.html',
	styleUrl: './add-member-dialog-box.component.scss'
})
export class AddMemberDialogBoxComponent implements OnDestroy {

	destroy$ = new Subject<boolean>();

	newMember: CreateMemberDto;

	addMemberForm: FormGroup;

	roles = Object.values(memberRoleEnum);

	readonly dialog = inject(MatDialog);

	hidePassword = true;

	constructor(
		private fb: RxFormBuilder,
		@Inject(MAT_DIALOG_DATA) public data: { addMember: Function, status: Signal<Status>, setSuccessStatus: Function },
		private dialogRef: MatDialogRef<AddMemberDialogBoxComponent>
	) {
		this.newMember = new CreateMemberDto();
		this.addMemberForm = this.fb.formGroup(this.newMember);

		effect(() => {
			if (this.data.status() === Status.SUCCESS) {
				this.dialog.open(MemberAddedSuccessDialogBoxComponent, {
					data: {
						email: this.newMember.email,
						password: this.newMember.password,
					}
				});
			}
		});
	}


	onSubmit() {
		if (this.addMemberForm.valid) {
			this.data.addMember(this.newMember);
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
