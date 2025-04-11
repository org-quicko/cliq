import { Component, computed, effect, Inject, inject, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';
import { RxFormBuilder } from '@rxweb/reactive-form-validators';
import { Status, UpdatePromoterDto } from '@org.quicko.cliq/ngx-core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PromoterStore } from '../../../../../../store/promoter.store';
import { ProgramStore } from '../../../../../../store/program.store';

@Component({
	selector: 'app-edit-promoter-dialog-box',
	imports: [
		FormsModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatFormFieldModule,
		MatDialogModule,
		MatIconModule,
		MatInputModule,
		MatProgressSpinnerModule
	],
	templateUrl: './edit-promoter-dialog-box.component.html',
	styleUrl: './edit-promoter-dialog-box.component.scss'
})
export class EditPromoterDialogBoxComponent implements OnInit, OnDestroy {
	destroy$ = new Subject<boolean>();

	refValUniqueCode: string;

	readonly programStore = inject(ProgramStore);
	readonly promoterStore = inject(PromoterStore);

	readonly programId = computed(() => this.programStore.program()!.programId);
	readonly promoterId = computed(() => this.promoterStore.promoter()!.promoterId);

	readonly promoter = computed(() => this.promoterStore.promoter());

	promoterDetails: UpdatePromoterDto;

	editPromoterForm: FormGroup;

	hidePassword: boolean = true;

	readonly isLoading = computed(() => this.promoterStore.status() === Status.LOADING);

	constructor(
		private fb: RxFormBuilder,
		private dialogRef: MatDialogRef<EditPromoterDialogBoxComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any,
	) {
		effect(() => {
			this.promoterDetails = new UpdatePromoterDto();
			this.promoterDetails.name = this.promoter()?.name;
			this.promoterDetails.logoUrl = this.promoter()?.logoUrl;

			this.editPromoterForm = this.fb.formGroup(this.promoterDetails);
		});
	}

	closeDialog(): void {
		this.dialogRef.close();
	}

	ngOnInit(): void {

	}

	ngOnDestroy(): void {
		this.destroy$.next(true);
		this.destroy$.complete();
	}

	onSubmit() {
		if (this.editPromoterForm.valid) {
			this.promoterStore.updatePromoterInfo({
				updatedInfo: this.promoterDetails,
				programId: this.programId(),
				promoterId: this.promoterId()
			});
		}
	}
}
