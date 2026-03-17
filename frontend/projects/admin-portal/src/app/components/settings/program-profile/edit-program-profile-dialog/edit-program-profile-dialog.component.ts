import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { plainToInstance } from 'class-transformer';

import { ProgramDto, SnackbarService, UpdateProgramDto, visibilityEnum } from '@org.quicko.cliq/ngx-core';
import { FormDialogBoxComponent } from '../../../common/form-dialog-box/form-dialog-box.component';
import { ProgramStore } from '../../../../store/program.store';
import { RxFormBuilder } from '@rxweb/reactive-form-validators';

@Component({
	selector: 'app-edit-program-profile-dialog',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		FormDialogBoxComponent,
		TitleCasePipe,
	],
	templateUrl: './edit-program-profile-dialog.component.html',
})
export class EditProgramProfileDialogComponent {

	private readonly fb = inject(RxFormBuilder);
	private readonly snackbarService = inject(SnackbarService);
	private readonly programStore = inject(ProgramStore);

	readonly visibilityOptions = Object.values(visibilityEnum);

	form = this.fb.group({
		name: ['', Validators.required],
		visibility: ['', Validators.required],
	});

	isLoading = false;

	constructor(
		@Inject(MAT_DIALOG_DATA) public data: { program: ProgramDto },
		public dialogRef: MatDialogRef<EditProgramProfileDialogComponent>,
	) {
		this.form.patchValue({
			name: data.program.name,
			visibility: data.program.visibility,
		});
	}

	save = () => {
		if (this.form.invalid) return;

		const body = new UpdateProgramDto();
		body.name = this.form.value.name!;
		body.visibility = this.form.value.visibility!;

		const currentProgram = this.programStore.program() ?? this.data.program;
		this.programStore.updateProgram({
			programId: currentProgram!.programId,
			body,
		});

		this.dialogRef.close();
	};
}
