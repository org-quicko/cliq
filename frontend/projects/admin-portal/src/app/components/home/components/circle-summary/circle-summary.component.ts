import { Component, inject, effect, OnInit } from '@angular/core';
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
import { FormatCurrencyPipe, OrdinalDatePipe } from '@org.quicko.cliq/ngx-core';
import { ProgramStore } from '../../../../store/program.store';
import { CircleSummaryStore } from './store/circle-summary.store';
import { CircleFunctionsStore } from './store/circle-functions.store';
import { CirclePromotersStore } from './store/circle.promoters.store';

@Component({
    selector: 'app-circle-summary',
    standalone: true,
    imports: [
        CommonModule,
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

    programId!: string;
    circleId!: string;

    promoterSearchControl = new FormControl('');

    private lastProgramId: string | null = null;
    private lastCircleId: string | null = null;

    constructor() {
        effect(() => {
            if (
                this.lastProgramId === this.programId &&
                this.lastCircleId === this.circleId
            ) {
                return;
            }

            this.lastProgramId = this.programId;
            this.lastCircleId = this.circleId;

            this.loadAllData();
        });
    }

    readonly isCircleLoading = this.circleSummaryStore.isLoading;
    readonly isFunctionsLoading = this.circleFunctionsStore.isLoading;
    readonly isPromotersLoading = this.circlePromotersStore.isLoading;

    readonly circle = this.circleSummaryStore.circle;
    readonly circleName = this.circleSummaryStore.circleName;
    readonly isDefaultCircle = this.circleSummaryStore.isDefaultCircle;

    readonly functions = this.circleFunctionsStore.functions;
    readonly functionsTotal = this.circleFunctionsStore.total;

    readonly promoters = this.circlePromotersStore.promoters;
    readonly promotersTotal = this.circlePromotersStore.total;

    readonly program = this.programStore.program;

    ngOnInit(): void {
        this.route.params.subscribe((params: Params) => {
            this.circleId = params['circle_id'];
        });

        this.route.parent?.parent?.params.subscribe((params: Params) => {
            this.programId = params['program_id'];
        });

        this.promoterSearchControl.valueChanges
            .pipe(debounceTime(400), distinctUntilChanged())
            .subscribe(() => this.loadPromoters());
    }

    private loadAllData() {
        this.loadCircle();
        this.loadFunctions();
        this.loadPromoters();
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

    isFixedCommissionEffect(func: any): boolean {
        return (
            func?.effectType === 'generate_commission' &&
            func?.effect?.commission?.commissionType === 'fixed'
        );
    }

    getFixedCommissionValue(func: any): number | null {
        if (!this.isFixedCommissionEffect(func)) {
            return null;
        }

        return func?.effect?.commission?.value ?? null;
    }

    getEffectDisplay(func: any): string {
        if (func.effectType === 'generate_commission') {
            const effect = func.effect as any;
            if (effect?.commission?.commissionType === 'percentage') {
                return `${effect.commission.value}% Commission`;
            } else if (effect?.commission?.commissionType === 'fixed') {
                return `${effect.commission.value} Commission`;
            }
        } else if (func.effectType === 'switch_circle') {
            const effect = func.effect as any;
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

    getConditionsTooltip(func: any): string {
        const conditions = func.conditions as any[];
        if (!conditions || conditions.length === 0) return '';
        return conditions
            .map((c: any) => {
                const cond = c.condition ?? c;
                const param = cond.parameter ?? '';
                const op = this.operatorSymbolMap[cond.operator] ?? cond.operator;
                const val = cond.value ?? '';
                return `${param} ${op} ${val}`;
            })
            .join('\n');
    }
}
