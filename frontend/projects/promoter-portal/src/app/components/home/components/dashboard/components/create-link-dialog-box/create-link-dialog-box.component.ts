import { Component, computed, inject, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';
import { CreateLinkDto, PaginationOptions } from '@org.quicko.cliq/ngx-core';
import { ProgramStore } from '../../../../../../store/program.store';

@Component({
	selector: 'app-create-link-dialog-box',
	imports: [
		FormsModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatFormFieldModule,
		MatDialogModule,
		MatIconModule,
		MatInputModule,
		MatError
	],
	templateUrl: './create-link-dialog-box.component.html',
	styleUrl: './create-link-dialog-box.component.scss'
})
export class CreateLinkDialogBoxComponent implements OnInit, OnDestroy {

	destroy$ = new Subject<boolean>();

	readonly programStore = inject(ProgramStore);

	readonly createLinkForm = new FormGroup({
		name: new FormControl('', { nonNullable: true }),
		linkRefVal: new FormControl('', { nonNullable: true }),
	});

	linkRefSignal = signal(this.createLinkForm.controls.linkRefVal.value);

	constructor(
		private dialogRef: MatDialogRef<CreateLinkDialogBoxComponent>,
		@Inject(MAT_DIALOG_DATA) public data: { createLink: Function },
	) {
		this.createLinkForm.addValidators(this.validateLinkRefVal);
	}

	closeDialog(): void {
		this.dialogRef.close();
	}

	ngOnInit(): void {
		// Update signals when form control changes
		this.createLinkForm.controls.linkRefVal.valueChanges.subscribe(value => {
			this.linkRefSignal.set(value);
		});
	}
	ngOnDestroy(): void {
		this.destroy$.next(true);
		this.destroy$.complete();
	}

	onSubmit() {
		if (this.createLinkForm.valid) {
			const newLink = new CreateLinkDto();
			newLink.name = this.createLinkForm.controls.name.value;
			newLink.refVal = this.createLinkForm.controls.linkRefVal.value;

			this.data.createLink(newLink);
			this.dialogRef.close();
		}

	}

	validateLinkRefVal = (): { [key: string]: boolean } | null => {
		const refVal = this.createLinkForm.get('linkRefVal')!.value!;
		const dirty = this.createLinkForm.get('linkRefVal')?.dirty;

		const regex = /^[a-z][a-z0-9_-]{0,29}$/;

		if (dirty && !regex.test(refVal)) {
			return { invalidRefVal: true };
		} else return null;
	}
}
