import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AbilityServiceSignal } from '@casl/angular';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CircleDto, SnackbarService } from '@org.quicko.cliq/ngx-core';
import { UserAbility } from '../../permissions/ability';
import { CirclesService } from '../../services/circles.service';
import { ProgramStore } from '../../store/program.store';

@Component({
    selector: 'app-circle-workflow',
    imports: [ReactiveFormsModule, MatButtonModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
    templateUrl: './circle-workflow.component.html',
})
export class CircleWorkflowComponent {
    private readonly router = inject(Router);
    private readonly ability = inject<AbilityServiceSignal<UserAbility>>(AbilityServiceSignal);
    private readonly service = inject(CirclesService);
    private readonly snackbar = inject(SnackbarService);
    private readonly fb = inject(FormBuilder);
    readonly programId = inject(ProgramStore).program()!.programId;
    saving = false;
    error = '';
    readonly form = this.fb.group({
        name: ['', [Validators.required, Validators.pattern(/\S/)]],
    });

    constructor() {
        if (!this.allowed()) this.exit();
    }

    allowed() { return this.ability.can('create', CircleDto); }

    exit() {
        if (this.saving) return;
        this.router.navigate(['/', this.programId, 'home', 'circles']);
    }

    save() {
        if (this.saving || !this.allowed()) return;
        this.error = '';
        this.form.controls.name.markAsTouched();
        if (this.form.controls.name.invalid) return;
        this.saving = true;
        this.service.createCircle(this.programId, { name: this.form.controls.name.value!.trim() }).subscribe({
            next: () => {
                this.snackbar.openSnackBar('Circle created successfully', '');
                this.saving = false;
                this.exit();
            },
            error: () => { this.saving = false; this.error = 'Unable to create the circle. Please try again.'; },
        });
    }
}
