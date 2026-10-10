import { FunctionActionsComponent } from './function-actions/function-actions.component';
import { MatMenuModule } from '@angular/material/menu';
import { CirclesService } from '../../../../services/circles.service';
import { SnackbarService } from '@org.quicko.cliq/ngx-core';
import { DeleteDialogComponent } from '../../../common/delete-dialog/delete-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AbilityServiceSignal } from '@casl/angular';
import { UserAbility } from '../../../../permissions/ability';
import { CircleDto } from '@org.quicko.cliq/ngx-core';
import { EditCircleFunctionDialogComponent } from './edit-circle-function-dialog/edit-circle-function-dialog.component';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { FormatCurrencyPipe, OrdinalDatePipe, FunctionDto, ConditionDto, effectEnum, commissionTypeEnum, GenerateCommissionEffect, SwitchCircleEffect, BaseConditionDto } from '@org.quicko.cliq/ngx-core';
import { ProgramStore } from '../../../../store/program.store';
import { CircleSummaryStore } from './store/circle-summary.store';
import { CircleFunctionsStore } from './store/circle-functions.store';
import { CirclePromotersStore } from './store/circle.promoters.store';

@Component({
    selector: 'app-circle-summary',
    standalone: true,
    imports: [
        CommonModule,
        FunctionActionsComponent,
        MatDialogModule,
        MatMenuModule,
        ReactiveFormsModule,
        MatDividerModule,
        MatIconModule,
        MatButtonModule,
        MatInputModule,
        MatTooltipModule,
        NgxSkeletonLoaderModule,
        FormatCurrencyPipe,
        OrdinalDatePipe
    ],
    providers: [CircleSummaryStore, CircleFunctionsStore, CirclePromotersStore],
    templateUrl: './circle-summary.component.html',
    styleUrl: './circle-summary.component.css',
})
export class CircleSummaryComponent implements OnInit {
    readonly circleSummaryStore = inject(CircleSummaryStore);
    readonly circleFunctionsStore = inject(CircleFunctionsStore);
    readonly circlePromotersStore = inject(CirclePromotersStore);
    readonly programStore = inject(ProgramStore);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    private readonly circlesService = inject(CirclesService);
    private readonly snackbar = inject(SnackbarService);
    deletingCircle = false;
    private readonly dialog = inject(MatDialog);
    private readonly ability = inject<AbilityServiceSignal<UserAbility>>(AbilityServiceSignal);
    readonly can = this.ability.can;
    readonly CircleDto = CircleDto;
    readonly FunctionDto = FunctionDto;

    editFunction(func: FunctionDto) {
        if (!this.can('update', FunctionDto)) return;
        this.router.navigate(['/', this.programId, 'circles', this.circleId, 'functions', func.functionId, 'edit']);
    }

    createFunction() {
        if (!this.can('create', FunctionDto)) return;
        this.router.navigate(['/', this.programId, 'circles', this.circleId, 'functions', 'create']);
    }

    programId!: string;
    circleId!: string;

    promoterSearchControl = new FormControl('');

    readonly isCircleLoading = this.circleSummaryStore.isLoading;
    readonly isFunctionsLoading = this.circleFunctionsStore.isLoading;
    readonly isPromotersLoading = this.circlePromotersStore.isLoading;

    readonly circle = this.circleSummaryStore.circle;

    readonly functions = this.circleFunctionsStore.functions;
    readonly functionsTotal = this.circleFunctionsStore.total;

    readonly promoters = this.circlePromotersStore.promoters;
    readonly promotersTotal = this.circlePromotersStore.total;

    readonly program = this.programStore.program;

    ngOnInit(): void {
        this.route.params.subscribe((params: Params) => {
            this.circleId = params['circle_id'];
        });

        this.programId = this.programStore.program()?.programId!;
        this.loadAllData();

        this.promoterSearchControl.valueChanges
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe(() => this.loadPromoters());
    }

    private loadAllData() {
        this.loadCircle();
        this.loadFunctions();
        this.loadPromoters();
    }

    editCircle() {
        const circle = this.circle();
        if (!circle || !this.can('update', CircleDto)) return;
        this.dialog.open(EditCircleFunctionDialogComponent, {
            width: '516px', maxWidth: '95vw', autoFocus: false, data: { programId: this.programId, circle },
        }).afterClosed().subscribe(saved => { if (saved) this.loadCircle(); });
    }

    deleteCircle() {
        const circle = this.circle();
        if (!circle || this.deletingCircle || !this.can('delete', CircleDto)) return;
        this.dialog.open(DeleteDialogComponent, {
            width: '448px', maxWidth: '95vw', autoFocus: false,
            data: {
                title: 'Delete circle?',
                message: `Delete "${circle.name}"? This action cannot be undone.`,
                confirmButtonText: 'Delete', cancelButtonText: 'Cancel',
                onSubmit: () => {
                    if (this.deletingCircle || !this.can('delete', CircleDto)) return;
                    this.deletingCircle = true;
                    this.circlesService.deleteCircle(this.programId, circle.circleId).subscribe({
                        next: () => {
                            this.snackbar.openSnackBar('Circle deleted successfully', '');
                            this.goBack();
                        },
                        error: () => {
                            this.deletingCircle = false;
                            this.snackbar.openSnackBar('Unable to delete circle. Please try again.', '');
                        },
                    });
                },
            },
        });
    }

    loadCircle() {
        this.circleSummaryStore.fetchCircle({
            programId: this.programId,
            circleId: this.circleId,
        });
    }

    loadFunctions() {
        this.circleFunctionsStore.fetchCircleFunctions({
            programId: this.programId,
            circleId: this.circleId,
            skip: 0,
            take: 5,
        });
    }

    loadPromoters() {
        this.circlePromotersStore.fetchCirclePromoters({
            programId: this.programId,
            circleId: this.circleId,
            search: this.promoterSearchControl.value?.trim() || undefined,
            skip: 0,
            take: 5,
        });
    }

    viewAllFunctions() {
        this.router.navigate(['functions'], { relativeTo: this.route });
    }

    viewAllPromoters() {
        this.router.navigate(['promoters'], { relativeTo: this.route });
    }

    goBack() {
        this.router.navigate(['../../circles'], { relativeTo: this.route });
    }

    isFixedCommissionEffect(func: FunctionDto): boolean {
        return (
            func?.effectType === effectEnum.GENERATE_COMMISSION &&
            (func?.effect as GenerateCommissionEffect)?.commission?.commissionType === commissionTypeEnum.FIXED
        );
    }

    getFixedCommissionValue(func: FunctionDto): number | null {
        if (!this.isFixedCommissionEffect(func)) {
            return null;
        }

        return (func?.effect as GenerateCommissionEffect)?.commission?.commissionValue;
    }

    getEffectDisplay(func: FunctionDto): string {
        if (func.effectType === effectEnum.GENERATE_COMMISSION) {
            const effect = func.effect as GenerateCommissionEffect;
            if (effect?.commission?.commissionType === commissionTypeEnum.PERCENTAGE) {
                return `${effect.commission.commissionValue}% Commission`;
            } else if (effect?.commission?.commissionType === commissionTypeEnum.FIXED) {
                return `${effect.commission.commissionValue} Commission`;
            }
        } else if (func.effectType === effectEnum.SWITCH_CIRCLE) {
            const effect = func.effect as SwitchCircleEffect;
            return `Switch to ${effect?.targetCircleName}`;
        }
        return func.effectType?.replace('_', ' ');
    }

    private readonly operatorSymbolMap: Record<string, string> = {
        greater_than_or_equal_to: '>=',
        less_than_or_equal_to: '<=',
        greater_than: '>',
        less_than: '<',
        equals: '=',
        contains: 'contains',
    };

    getConditionsTooltip(func: FunctionDto): string {
        const conditions = func.conditions;
        if (!conditions || conditions.length === 0) return '';
        return conditions
            .map((c: ConditionDto) => {
                const cond: BaseConditionDto = c.condition;
                const param = cond.parameter ?? '';
                const op = this.operatorSymbolMap[cond.operator] ?? cond.operator;
                const val = cond.value ?? '';
                return `${param} ${op} ${val}`;
            })
            .join('\n');
    }
}
