import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom } from 'rxjs';
import { plainToInstance, instanceToPlain } from 'class-transformer';

import { ProgramDto, SnackbarService, UpdateProgramDto, visibilityEnum } from '@org.quicko.cliq/ngx-core';
import { FormDialogBoxComponent } from '../../../common/form-dialog-box/form-dialog-box.component';
import { ProgramService } from '../../../../services/program.service';
import { ProgramStore } from '../../../../store/program.store';

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

	private readonly fb = inject(FormBuilder);
	private readonly snackbarService = inject(SnackbarService);
	private readonly programService = inject(ProgramService);
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

	save = async () => {
		if (this.form.invalid) return;

		this.isLoading = true;

		const body = plainToInstance(UpdateProgramDto, {
			name: this.form.value.name!,
			visibility: this.form.value.visibility!,
		});

		try {
			await firstValueFrom(
				this.programService.updateProgram(this.data.program.programId, instanceToPlain(body) as UpdateProgramDto)
			);

			const response = await firstValueFrom(
				this.programService.getProgram(this.data.program.programId)
			);
			if (response.data) {
				this.programStore.setProgram(plainToInstance(ProgramDto, response.data));
			}

			this.snackbarService.openSnackBar('Program updated successfully', undefined);
			this.dialogRef.close();
		} catch (err) {
			this.snackbarService.openSnackBar('Failed to update program', undefined);
		} finally {
			this.isLoading = false;
		}
	};
}
