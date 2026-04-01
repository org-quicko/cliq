import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder,FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

export interface WebhookDialogData {
	assignedEvents: string[];
	onCreate: (data: { url: string; secret: string; events: string[] }) => void;
}

export interface WebhookEvent {
	value: string;
	label: string;
	description: string;
	icon: string;
}

export const AVAILABLE_EVENTS: WebhookEvent[] = [
	{ value: 'commission.created', label: 'commission.created', description: 'Occurs when a new commission is created.', icon: 'payments' },
	{ value: 'signup.created', label: 'signup.created', description: 'Occurs when a user signs up.', icon: 'person_add' },
	{ value: 'purchase.created', label: 'purchase.created', description: 'Occurs when a new purchase is created.', icon: 'local_mall' },
	{ value: 'contact.created', label: 'contact.created', description: 'Occurs when a new contact is created.', icon: 'demography' },
];

@Component({
	selector: 'app-webhook-dialog',
	imports: [
		CommonModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatDialogModule,
		MatFormFieldModule,
		MatInputModule,
		MatIconModule,
		MatCheckboxModule,
	],
	templateUrl: './webhook-dialog.component.html',
	styleUrl: './webhook-dialog.component.css',
})
export class WebhookDialogComponent {
	form: FormGroup;
	availableEvents = AVAILABLE_EVENTS;

	constructor(
		private fb: FormBuilder,
		private dialogRef: MatDialogRef<WebhookDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: WebhookDialogData,
	) {
		this.form = this.fb.group({
			url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
			secret: ['', [Validators.required]],
			events: [[] as string[], [Validators.required]],
		});
	}

	onEventToggle(eventValue: string, checked: boolean) {
		const current: string[] = this.form.get('events')!.value;
		if (checked) {
			this.form.get('events')!.setValue([...current, eventValue]);
		} else {
			this.form.get('events')!.setValue(current.filter(e => e !== eventValue));
		}
		this.form.get('events')!.markAsTouched();
	}

	isEventSelected(eventValue: string): boolean {
		return (this.form.get('events')!.value as string[]).includes(eventValue);
	}

	isEventDisabled(eventValue: string): boolean {
		return (this.data.assignedEvents ?? []).includes(eventValue);
	}

	onSubmit() {
		if (this.form.invalid || this.form.get('events')!.value.length === 0) {
			this.form.markAllAsTouched();
			return;
		}

		this.data.onCreate({
			url: this.form.get('url')!.value,
			secret: this.form.get('secret')!.value,
			events: this.form.get('events')!.value,
		});
		this.dialogRef.close(true);
	}

	closeDialog() {
		this.dialogRef.close(false);
	}
}
