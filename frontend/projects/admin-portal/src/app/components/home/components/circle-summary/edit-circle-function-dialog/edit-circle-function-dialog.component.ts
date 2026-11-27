import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CircleDto, SnackbarService } from '@org.quicko.cliq/ngx-core';
import { CirclesService } from '../../../../../services/circles.service';

@Component({
    selector: 'app-edit-circle-function-dialog',
    imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './edit-circle-function-dialog.component.html',
})
export class EditCircleFunctionDialogComponent {
    readonly data = inject<{ programId: string; circle: CircleDto }>(MAT_DIALOG_DATA);
    private readonly ref = inject(MatDialogRef<EditCircleFunctionDialogComponent>);
    private readonly service = inject(CirclesService);
    private readonly snackbar = inject(SnackbarService);
    private readonly fb = inject(FormBuilder);
    saving = false;
    error = '';
    readonly form = this.fb.group({
        name: [this.data.circle?.name ?? '', [Validators.required, Validators.pattern(/\S/)]],
    });

    close() { if (!this.saving) this.ref.close(); }

    save() {
        if (this.saving) return;
        this.form.markAllAsTouched();
        if (this.form.invalid) return;
        const v = this.form.getRawValue();
        this.error = '';
        this.saving = true;
        this.ref.disableClose = true;
        const request = this.service.updateCircle(this.data.programId, this.data.circle!.circleId, { name: v.name!.trim() });
        request.subscribe({
            next: () => {
                this.snackbar.openSnackBar('Circle updated successfully', '');
                this.ref.close(true);
            },
            error: () => {
                this.saving = false;
                this.ref.disableClose = false;
                this.error = 'Unable to save changes. Please try again.';
            },
        });
    }
}
