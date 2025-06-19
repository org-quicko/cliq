import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';

@Component({
	selector: 'app-member-added-success-dialog-box',
	imports: [ReactiveFormsModule, MatDialogModule, MatIconModule, MatButtonModule, MatFormFieldModule, FormsModule, MatInputModule],
	templateUrl: './member-added-success-dialog-box.component.html',
	styleUrl: './member-added-success-dialog-box.component.css'
})
export class MemberAddedSuccessDialogBoxComponent implements OnDestroy {

	destroy$ = new Subject<boolean>();

	hidePassword = true;

	copyMemberDetails: FormGroup;

	constructor(
		@Inject(MAT_DIALOG_DATA) public data: { email: string, password: string },
		private dialogRef: MatDialogRef<MemberAddedSuccessDialogBoxComponent>
	) {

		this.copyMemberDetails = new FormGroup({
			email: new FormControl(this.data.email, { nonNullable: true }),
			password: new FormControl(this.data.password, { nonNullable: true }),
		});
		this.copyMemberDetails.disable();
	}

	closeDialog() {
		this.dialogRef.close();
	}

	ngOnDestroy(): void {
		this.destroy$.next(true);
		this.destroy$.complete();
	}

	onSubmit() {
		const copyText = `Email: ${this.data.email}\nPassword: ${this.data.password}`;
		navigator.clipboard.writeText(copyText);
		this.dialogRef.close(true);
	}

}
