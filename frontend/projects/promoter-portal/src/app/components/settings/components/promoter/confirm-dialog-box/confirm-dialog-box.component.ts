import { Component, EventEmitter, Inject, OnDestroy, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';

@Component({
	selector: 'app-confirm-dialog-box',
	imports: [MatButtonModule, MatIconModule, MatFormFieldModule, FormsModule, MatDialogModule],
	templateUrl: './confirm-dialog-box.component.html',
	styleUrl: './confirm-dialog-box.component.scss'
})
export class ConfirmDialogBoxComponent implements OnDestroy {

	destroy$ = new Subject<boolean>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public data: { message: string, confirmButtonText?: string, cancelButtonText?: string, title?: string, onSubmit: Function },
		private dialogRef: MatDialogRef<ConfirmDialogBoxComponent>
	) { }

	onSubmit() {
		this.dialogRef.close(true);
		this.data.onSubmit();
	}

	closeDialog() {
		this.dialogRef.close(false);
	}

	ngOnDestroy(): void {
		this.destroy$.next(true);
		this.destroy$.complete();
	}
}
