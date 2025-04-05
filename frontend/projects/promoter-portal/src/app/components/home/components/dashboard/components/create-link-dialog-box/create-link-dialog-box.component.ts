import { Component, computed, inject, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';
import { ProgramStore } from '../../../../../../store/program.store';
import { CreateLinkDto } from '@org.quicko.cliq/ngx-core';
import { MatButtonModule } from '@angular/material/button';

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
	],
	templateUrl: './create-link-dialog-box.component.html',
	styleUrl: './create-link-dialog-box.component.scss'
})
export class CreateLinkDialogBoxComponent implements OnInit, OnDestroy {

	destroy$ = new Subject<boolean>();

	refValUniqueCode: string;

	readonly programStore = inject(ProgramStore);

	readonly createLinkForm = new FormGroup({
		name: new FormControl('', { nonNullable: true }),
		linkRefVal: new FormControl('', { nonNullable: true }),
	});

	linkRefSignal = signal(this.createLinkForm.controls.linkRefVal.value);

	randomCode = signal(this.generateRandomCode());

	constructor(
		private dialogRef: MatDialogRef<CreateLinkDialogBoxComponent>,
		@Inject(MAT_DIALOG_DATA) public data: { createLink: Function },
	) { }

	closeDialog(): void {
		this.dialogRef.close();
	}

	ngOnInit(): void {
		// Update signals when form control changes
		this.createLinkForm.controls.linkRefVal.valueChanges.subscribe(value => {
			this.linkRefSignal.set(value);
			this.randomCode.set(this.generateRandomCode()); // Regenerate the random code
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
			newLink.refVal = this.createLinkForm.controls.linkRefVal.value + '-' + this.randomCode();

			this.data.createLink(newLink);
		}

		this.dialogRef.close();
	}

	private generateRandomCode(): string {
		return Math.random().toString(36).substring(2, 9); // Generates a random string of 7 characters
	}
}
