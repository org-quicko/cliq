import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { FormatCurrencyPipe, ConditionDto, GenerateCommissionEffect, SwitchCircleEffect, FunctionDto, effectEnum, commissionTypeEnum, BaseConditionDto } from '@org.quicko.cliq/ngx-core';
import { ProgramStore } from '../../../../../store/program.store';
import { CircleSummaryStore } from '../store/circle-summary.store';
import { CircleFunctionsStore } from '../store/circle-functions.store';

@Component({
    selector: 'app-circle-functions',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatPaginatorModule,
        MatTooltipModule,
        NgxSkeletonLoaderModule,
        FormatCurrencyPipe,
    ],
    providers: [CircleSummaryStore, CircleFunctionsStore],
    templateUrl: './circle-functions.component.html',
    styleUrl: './circle-functions.component.css',
})
export class CircleFunctionsComponent implements OnInit {
    readonly circleSummaryStore = inject(CircleSummaryStore);
    readonly circleFunctionsStore = inject(CircleFunctionsStore);
    readonly programStore = inject(ProgramStore);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    programId!: string;
    circleId!: string;

    paginationOptions = signal({
        pageIndex: 0,
        pageSize: 10,
    });

    readonly isCircleLoading = this.circleSummaryStore.isLoading;
    readonly isFunctionsLoading = this.circleFunctionsStore.isLoading;

    readonly functions = this.circleFunctionsStore.functions;
    readonly functionsTotal = this.circleFunctionsStore.total;

    readonly program = this.programStore.program;

    ngOnInit(): void {
        this.route.parent?.params.subscribe((params: Params) => {
            this.circleId = params['circle_id'];
        });

        this.programId = this.programStore.program()?.programId!;
        this.circleSummaryStore.fetchCircle({ programId: this.programId, circleId: this.circleId });
        this.loadFunctions();
    }

    loadFunctions() {
        this.circleFunctionsStore.fetchCircleFunctions({
            programId: this.programId,
            circleId: this.circleId,
            skip: this.paginationOptions().pageIndex * this.paginationOptions().pageSize,
            take: this.paginationOptions().pageSize,
        });
    }

    onPageChange(event: PageEvent) {
        this.paginationOptions.set({
            pageIndex: event.pageIndex,
            pageSize: event.pageSize,
        });
        this.loadFunctions();
    }

    goBack() {
        this.router.navigate(['..'], { relativeTo: this.route });
    }

    goToCircles() {
        this.router.navigate(['../../'], { relativeTo: this.route });
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
