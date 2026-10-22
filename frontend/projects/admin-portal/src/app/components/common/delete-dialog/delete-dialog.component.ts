import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-delete-dialog',
    imports: [MatDialogModule, MatButtonModule],
    template: `
        <div class="p-6 bg-surface-container-lowest">
            <div class="flex flex-col gap-6">
                <div class="flex flex-col gap-2">
                    <div class="mat-title-medium text-on-surface break-all">{{ data.title }}</div>
                    <div class="mat-body-medium text-on-surface-variant">{{ data.message }}</div>
                </div>
                <div class="flex gap-2 justify-end">
                    <button mat-button mat-dialog-close type="button">Cancel</button>
                    <button mat-flat-button type="button" class="rounded-full bg-error" (click)="confirm()">Delete</button>
                </div>
            </div>
        </div>
    `,
})
export class DeleteDialogComponent {
    readonly data = inject<{ title: string; message: string; onSubmit: () => void }>(MAT_DIALOG_DATA);
    private readonly ref = inject(MatDialogRef<DeleteDialogComponent>);
    confirm() {
        this.data.onSubmit();
        this.ref.close(true);
    }
}
