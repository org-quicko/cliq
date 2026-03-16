// import { Component, Inject, inject } from '@angular/core';
// import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
// import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { QuillModule } from 'ngx-quill';
// import { firstValueFrom } from 'rxjs';
// import { plainToInstance, instanceToPlain } from 'class-transformer';

// import { ProgramDto, SnackbarService, UpdateProgramDto } from '@org.quicko.cliq/ngx-core';
// import { ProgramService } from '../../../../services/program.service';
// import { ProgramStore } from '../../../../store/program.store';
// import { MarkdownContentComponent } from '../../../common/markdown-content/markdown-content.component';

// @Component({
// 	selector: 'app-edit-terms-dialog',
// 	standalone: true,
// 	imports: [
// 		CommonModule,
// 		ReactiveFormsModule,
// 		MatFormFieldModule,
// 		MatInputModule,
// 		MatButtonModule,
// 		MatIconModule,
// 		MatDialogModule,
// 		MatProgressSpinnerModule,
// 		QuillModule,
// 		MarkdownContentComponent,
// 	],
// 	templateUrl: './edit-terms-dialog.component.html',
// 	styleUrl: './edit-terms-dialog.component.css',
// })
// export class EditTermsDialogComponent {

// 	private readonly fb = inject(FormBuilder);
// 	private readonly snackbarService = inject(SnackbarService);
// 	private readonly programService = inject(ProgramService);
// 	private readonly programStore = inject(ProgramStore);

// 	form = this.fb.group({
// 		termsAndConditions: [''],
// 	});

// 	isLoading = false;

// 	quillModules = {
// 		toolbar: [
// 			['bold', 'italic', 'underline'],
// 			[{ header: 1 }, { header: 2 }, { header: 3 }, { header: 4 }],
// 			[{ list: 'ordered' }, { list: 'bullet' }],
// 			[{ align: [] }],
// 		],
// 	};

// 	constructor(
// 		@Inject(MAT_DIALOG_DATA) public data: { program: ProgramDto },
// 		public dialogRef: MatDialogRef<EditTermsDialogComponent>,
// 	) {
// 		this.form.patchValue({
// 			termsAndConditions: data.program.termsAndConditions ?? '',
// 		});
// 	}

// 	async save() {
// 		this.isLoading = true;

// 		const body = plainToInstance(UpdateProgramDto, {
// 			termsAndConditions: this.form.value.termsAndConditions ?? '',
// 		});

// 		try {
// 			await firstValueFrom(
// 				this.programService.updateProgram(this.data.program.programId, instanceToPlain(body) as UpdateProgramDto)
// 			);

// 			const response = await firstValueFrom(
// 				this.programService.getProgram(this.data.program.programId)
// 			);
// 			if (response.data) {
// 				this.programStore.setProgram(plainToInstance(ProgramDto, response.data));
// 			}

// 			this.snackbarService.openSnackBar('Terms & Conditions updated successfully', undefined);
// 			this.dialogRef.close();
// 		} catch (err) {
// 			this.snackbarService.openSnackBar('Failed to update Terms & Conditions', undefined);
// 		} finally {
// 			this.isLoading = false;
// 		}
// 	}
// }
