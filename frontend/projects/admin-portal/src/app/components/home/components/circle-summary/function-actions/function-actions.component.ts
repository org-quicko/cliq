import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AbilityServiceSignal } from '@casl/angular';
import { FunctionDto, SnackbarService } from '@org.quicko.cliq/ngx-core';
import { UserAbility } from '../../../../../permissions/ability';
import { CirclesService } from '../../../../../services/circles.service';
import { DeleteDialogComponent } from '../../../../common/delete-dialog/delete-dialog.component';

@Component({
    selector: 'app-function-actions',
    imports: [MatButtonModule, MatIconModule, MatMenuModule, MatDialogModule],
    template: `
        @if (can('update', FunctionDto) || can('delete', FunctionDto)) {
            <button mat-icon-button type="button" [matMenuTriggerFor]="menu" [attr.aria-label]="'Actions for ' + func.name" [disabled]="pending">
                <mat-icon class="material-symbols-outlined text-on-surface">more_vert</mat-icon>
            </button>
            <mat-menu #menu="matMenu" class="w-[200px] min-w-[112px] max-w-[280px] rounded-[4px] bg-surface-container-lowest font-sans">
                @if (can('update', FunctionDto)) {
                    <button mat-menu-item class="h-[56px] py-8 flex gap-[12px]" (click)="edit()"><mat-icon class="material-symbols-outlined">edit</mat-icon><span class="mat-body-large text-on-surface">Edit</span></button>
                    <button mat-menu-item class="h-[56px] py-8 flex gap-[12px]" (click)="toggleStatus()"><mat-icon class="material-symbols-outlined">{{ func.status === 'inactive' ? 'play_arrow' : 'pause' }}</mat-icon><span class="mat-body-large text-on-surface">{{ func.status === 'inactive' ? 'Mark active' : 'Mark inactive' }}</span></button>
                }
                @if (can('delete', FunctionDto)) {
                    <button mat-menu-item class="h-[56px] py-8 flex gap-[12px]" (click)="delete()"><mat-icon class="material-symbols-outlined">delete</mat-icon><span class="mat-body-large text-on-surface">Delete</span></button>
                }
            </mat-menu>
        }
    `,
})
export class FunctionActionsComponent {
    @Input({ required: true }) func!: FunctionDto;
    @Input({ required: true }) programId!: string;
    @Output() editRequested = new EventEmitter<void>();
    @Output() changed = new EventEmitter<boolean>();
    private readonly ability = inject<AbilityServiceSignal<UserAbility>>(AbilityServiceSignal);
    readonly can = this.ability.can;
    readonly FunctionDto = FunctionDto;
    private readonly service = inject(CirclesService);
    private readonly snackbar = inject(SnackbarService);
    private readonly dialog = inject(MatDialog);
    pending = false;

    edit() {
        if (!this.pending && this.can('update', FunctionDto)) this.editRequested.emit();
    }

    toggleStatus() {
        if (this.pending || !this.can('update', FunctionDto)) return;
        const status = this.func.status === 'inactive' ? 'active' : 'inactive';
        this.pending = true;
        this.service.updateFunction(this.programId, this.func.functionId, { status }).subscribe({
            next: () => {
                this.pending = false;
                this.snackbar.openSnackBar(`Function marked ${status}`, '');
                this.changed.emit(false);
            },
            error: () => {
                this.pending = false;
                this.snackbar.openSnackBar('Unable to update function status. Please try again.', '');
            },
        });
    }

    delete() {
        if (this.pending || !this.can('delete', FunctionDto)) return;
        this.dialog.open(DeleteDialogComponent, {
            width: '448px', maxWidth: '95vw', autoFocus: false,
            data: {
                title: `Delete ${this.func.name}?`,
                message: 'This permanently removes the function and its conditions. Existing commissions and circle memberships are kept. You cannot undo this action.',
                onSubmit: () => {
                    if (this.pending || !this.can('delete', FunctionDto)) return;
                    this.pending = true;
                    this.service.deleteFunction(this.programId, this.func.functionId).subscribe({
                        next: () => {
                            this.pending = false;
                            this.snackbar.openSnackBar('Function deleted successfully', '');
                            this.changed.emit(true);
                        },
                        error: () => {
                            this.pending = false;
                            this.snackbar.openSnackBar('Unable to delete function. Please try again.', '');
                        },
                    });
                },
            },
        });
    }
}
