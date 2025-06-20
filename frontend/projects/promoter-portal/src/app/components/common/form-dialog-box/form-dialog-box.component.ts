import { NgClass } from '@angular/common';
import { Component, Inject, Input, OnDestroy } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';

@Component({
	selector: 'app-form-dialog-box',
	imports: [
		FormsModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatFormFieldModule,
		MatDialogModule,
		MatIconModule,
		MatInputModule,
		MatProgressSpinnerModule,
		NgClass
	],
	templateUrl: './form-dialog-box.component.html',
	styleUrl: './form-dialog-box.component.css'
})
export class FormDialogBoxComponent implements OnDestroy {
	@Input({ required: true }) formGroup: FormGroup;
	@Input({ required: true }) onSubmit: Function;
	@Input({ required: false }) width?: string;
	@Input({ required: false }) height?: string;
	@Input({ required: true }) icon: string;
	@Input({ required: true }) headerText: string;

	// TODO: primary and secondary button action
	@Input({ required: false }) cancelBtnText?: string;
	@Input({ required: false }) submitBtnText?: string;

	@Input({ required: false }) isLoading: boolean = false;

	destroy$ = new Subject<boolean>();

	constructor(
		private dialogRef: MatDialogRef<FormDialogBoxComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any,
	) { }

	ngOnDestroy(): void {
		this.destroy$.next(true);
		this.destroy$.complete();
	}

	closeDialog(): void {
		this.dialogRef.close();
	}
}
