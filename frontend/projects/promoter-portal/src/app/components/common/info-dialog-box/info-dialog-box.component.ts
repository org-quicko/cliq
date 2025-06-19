import { Component, EventEmitter, Inject, OnDestroy, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';

@Component({
	selector: 'app-info-dialog-box',
	imports: [MatButtonModule, MatIconModule, MatFormFieldModule, FormsModule, MatDialogModule],
	templateUrl: './info-dialog-box.component.html',
	styleUrl: './info-dialog-box.component.css'
})
export class InfoDialogBoxComponent implements OnDestroy {

	destroy$ = new Subject<boolean>();

	constructor(
		@Inject(MAT_DIALOG_DATA) public data: { message: string, confirmButtonText?: string, cancelButtonText?: string, title?: string, removeCancelBtn?: boolean, onSubmit: Function },
		private dialogRef: MatDialogRef<InfoDialogBoxComponent>
	) { }

	onSubmit() {
		this.data.onSubmit();
		this.dialogRef.close(true);
	}

	closeDialog() {
		this.dialogRef.close(false);
	}

	ngOnDestroy(): void {
		this.destroy$.next(true);
		this.destroy$.complete();
	}
}
