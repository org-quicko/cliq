import { map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AbilityServiceSignal } from '@casl/angular';
import { UserAbility } from '../../permissions/ability';
import { ProgramStore } from '../../store/program.store';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { CircleDto, FunctionDto, GenerateCommissionEffect, SwitchCircleEffect, SnackbarService, conditionParameterEnum, conditionOperatorEnum } from '@org.quicko.cliq/ngx-core';
import { plainToInstance } from 'class-transformer';
import { CircleWorkbook } from '@org-quicko/cliq-sheet-core/Circle/beans';
import { CirclesService } from '../../services/circles.service';

@Component({
    selector: 'app-function-workflow',
    imports: [CommonModule, ReactiveFormsModule, MatDividerModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './function-workflow.component.html',
    styleUrl: './function-workflow.component.css',
})
export class FunctionWorkflowComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly programStore = inject(ProgramStore);
    private readonly ability = inject<AbilityServiceSignal<UserAbility>>(AbilityServiceSignal);
    readonly programId = this.programStore.program()!.programId;
    readonly programStoreCurrency = this.programStore.program()?.currency ?? '';
    readonly circleId = this.route.snapshot.paramMap.get('circle_id')!;
    readonly functionId = this.route.snapshot.paramMap.get('function_id');
    readonly editing = !!this.functionId;
    readonly steps = ['Details', 'Effect', 'Conditions', 'Review'];
    step = 0;
    loading = false;
    loadError = false;
    func?: FunctionDto;
    private readonly service = inject(CirclesService);
    private readonly snackbar = inject(SnackbarService);
    private readonly fb = inject(FormBuilder);
    readonly parameters = Object.values(conditionParameterEnum);
    readonly parameterLabels: Record<string, string> = {
        revenue: 'Revenue', 'no. of signups': 'Number of Signups', 'no. of purchases': 'Number of purchases', item_id: 'Item Id',
    };
    readonly operatorLabels: Record<string, string> = {
        greater_than_or_equal_to: 'is at least', less_than_or_equal_to: 'is at most',
        greater_than: 'is greater than', less_than: 'is less than', equals: 'equals', contains: 'contains',
    };

    availableOperators(parameter: string): string[] {
        return Object.values(conditionOperatorEnum).filter(operator => parameter === 'item_id'
            ? ['equals', 'contains'].includes(operator)
            : operator !== 'contains');
    }

    changeParameter(index: number) {
        const group = this.conditions.at(index);
        const operators = this.availableOperators(group.value.parameter);
        if (!operators.includes(group.value.operator)) group.patchValue({ operator: operators[0] });
        group.patchValue({ value: group.value.parameter === 'item_id' ? '' : 1 });
    }

    conditionText(condition: { parameter: string; operator: string; value: string | number | null }): string {
        let value = String(condition.value ?? '').trim();
        if (!value) value = '…';
        else if (condition.parameter === 'item_id') value = `“${value}”`;
        else if (Number.isFinite(Number(value))) {
            value = condition.parameter === 'revenue' && /^[A-Z]{3}$/.test(this.programStoreCurrency)
                ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: this.programStoreCurrency, maximumFractionDigits: 2 }).format(Number(value))
                : new Intl.NumberFormat('en-IN').format(Number(value));
        }
        return `${this.parameterLabels[condition.parameter] ?? condition.parameter} ${this.operatorLabels[condition.operator] ?? condition.operator} ${value}`;
    }
    circles: { id: string; name: string }[] = [];
    circlesLoading = false;
    circlesError = false;
    saving = false;
    error = '';
    readonly form = this.fb.group({
        name: [this.func?.name ?? '', [Validators.required, Validators.pattern(/\S/)]],
        trigger: [this.func?.trigger ?? 'purchase'],
        effectType: [this.func?.effectType ?? 'generate_commission'],
        commissionType: [(this.func?.effect as GenerateCommissionEffect)?.commission?.commissionType ?? 'percentage'],
        commissionValue: [(this.func?.effect as GenerateCommissionEffect)?.commission?.commissionValue ?? 1],
        targetCircleId: [(this.func?.effect as SwitchCircleEffect)?.targetCircleId ?? ''],
        conditions: this.fb.array((this.func?.conditions ?? []).map(c => this.conditionGroup(c.condition, c.conditionId))),
    });

    constructor() {
        if (!this.allowed()) {
            this.exit();
            return;
        }
        this.loadCircles();
        if (this.editing) this.loadFunction();
    }

    allowed() { return this.ability.can(this.editing ? 'update' : 'create', FunctionDto); }

    loadFunction() {
        this.loading = true;
        this.loadError = false;
        this.service.getFunction(this.programId, this.functionId!).subscribe({
            next: response => {
                if (!response.data) {
                    this.loading = false;
                    this.loadError = true;
                    return;
                }
                this.func = plainToInstance(FunctionDto, response.data);
                if (this.func.circleId !== this.circleId) {
                    this.loading = false;
                    this.loadError = true;
                    return;
                }
                const commission = (this.func.effect as GenerateCommissionEffect)?.commission;
                const target = this.func.effect as SwitchCircleEffect;
                this.form.patchValue({
                    name: this.func.name, trigger: this.func.trigger,
                    effectType: this.func.effectType, commissionType: commission?.commissionType ?? 'percentage',
                    commissionValue: commission?.commissionValue ?? 1, targetCircleId: target?.targetCircleId ?? (response.data.effect as SwitchCircleEffect & { target_circle_id?: string })?.target_circle_id ?? '',
                });
                this.conditions.clear();
                for (const c of this.func.conditions ?? []) this.conditions.push(this.conditionGroup(c.condition, c.conditionId));
                this.loading = false;
            },
            error: () => { this.loading = false; this.loadError = true; },
        });
    }

    exit() {
        if (this.saving) return;
        this.router.navigate(['/', this.programId, 'home', 'circles', this.circleId, 'functions']);
    }

    back() { if (!this.saving && this.step > 0) { this.step--; this.error = ''; } }

    next() {
        if (this.saving || this.loading || this.loadError || !this.allowed()) return;
        this.error = '';
        if (!this.validateStep(this.step)) return;
        if (this.step < this.steps.length - 1) this.step++;
        else this.save();
    }

    validateStep(step: number): boolean {
        const v = this.form.getRawValue();
        if (step === 0) {
            this.form.controls.name.markAsTouched();
            return this.form.controls.name.valid;
        }
        if (step === 1) {
            if (v.effectType === 'generate_commission') {
                const value = Number(v.commissionValue);
                if (!Number.isFinite(value) || value < 0.01 || (v.commissionType === 'percentage' && value > 100)) {
                    this.error = 'Enter a commission of at least 0.01; percentages cannot exceed 100.';
                    return false;
                }
            } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.targetCircleId ?? '')) {
                this.error = 'Choose a target circle.';
                return false;
            }
        }
        if (step === 2) {
            this.conditions.markAllAsTouched();
            if (this.conditions.invalid || v.conditions.some(c => c.parameter === 'item_id'
                ? !['equals', 'contains'].includes(c.operator!) || !String(c.value ?? '').trim()
                : c.operator === 'contains' || !Number.isFinite(Number(c.value)) || Number(c.value) < 1)) {
                this.error = 'Numeric conditions require a value of at least 1 and a numeric operator. Item ID supports equals or contains.';
                return false;
            }
        }
        return true;
    }

    loadCircles(skip = 0) {
        this.circlesLoading = true;
        this.circlesError = false;
        if (skip === 0) this.circles = [];
        this.service.getAllCircles(this.programId, undefined, skip, 100).subscribe({
            next: response => {
                const workbook = plainToInstance(CircleWorkbook, response.data);
                const table = workbook.getCircleSheet().getCircleTable();
                const rows = table.getRows();
                for (let i = 0; i < rows.length; i++) {
                    const row = table.getRow(i);
                    this.circles.push({ id: row.getCircleId(), name: row.getName() });
                }
                if (skip + rows.length < Number(workbook.getMetadata()?.get('total') ?? 0) && rows.length > 0) {
                    this.loadCircles(skip + rows.length);
                } else {
                    this.circlesLoading = false;
                }
            },
            error: () => { this.circlesLoading = false; this.circlesError = true; },
        });
    }

    get conditions(): FormArray { return this.form.controls.conditions; }

    conditionGroup(condition?: { parameter: string; operator: string; value: string | number }, id?: string) {
        return this.fb.group({
            id: [id],
            parameter: [condition?.parameter ?? 'revenue', Validators.required],
            operator: [condition?.operator ?? 'greater_than_or_equal_to', Validators.required],
            value: [condition?.value ?? 1, Validators.required],
        });
    }

    addCondition() { this.conditions.push(this.conditionGroup()); }

    targetCircleName() {
        return this.circles.find(c => c.id === this.form.controls.targetCircleId.value)?.name ?? (this.func?.effect as SwitchCircleEffect)?.targetCircleName ?? '';
    }

    save() {
        if (this.saving || this.loading || this.loadError || !this.allowed() || this.step !== 3) return;
        for (let i = 0; i < 3; i++) {
            if (!this.validateStep(i)) { this.step = i; return; }
        }
        const v = this.form.getRawValue();
        const effect = v.effectType === 'generate_commission'
            ? { commission: { commission_type: v.commissionType, commission_value: Number(v.commissionValue) } }
            : { target_circle_id: v.targetCircleId };
        const body = {
            name: v.name!.trim(), trigger: v.trigger, effect_type: v.effectType, effect,
            ...(!this.editing ? { status: 'active' } : {}),
            circle_id: this.circleId,
            conditions: v.conditions.map(c => ({
                ...(c.id ? { condition_id: c.id } : {}),
                condition: { parameter: c.parameter, operator: c.operator, value: c.parameter === 'item_id' ? String(c.value) : Number(c.value) },
            })),
        };
        this.saving = true;
        const request = this.editing
            ? this.service.updateFunction(this.programId, this.functionId!, body).pipe(map(() => undefined))
            : this.service.createFunction(this.programId, body).pipe(map(() => undefined));
        request.subscribe({
            next: () => {
                this.snackbar.openSnackBar(this.editing ? 'Function updated successfully' : 'Function created successfully', '');
                this.saving = false;
                this.exit();
            },
            error: () => { this.saving = false; this.error = 'Unable to save changes. Please try again.'; },
        });
    }
}
