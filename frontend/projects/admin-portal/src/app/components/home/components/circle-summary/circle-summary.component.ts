import { Component, inject, effect, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { FormatCurrencyPipe } from '@org.quicko.cliq/ngx-core';
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
        MatPaginatorModule,
        NgxSkeletonLoaderModule,
        FormatCurrencyPipe,
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

    searchControl = new FormControl('');

    paginationOptions = signal({
        pageIndex: 0,
        pageSize: 5,
    });

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

        this.searchControl.valueChanges
            .pipe(debounceTime(500), distinctUntilChanged())
            .subscribe((value) => {
                this.paginationOptions.set({ pageIndex: 0, pageSize: 5 });
                this.loadPromoters();
            });
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
            name: this.searchControl.value?.trim() || undefined,
            skip: this.paginationOptions().pageIndex * this.paginationOptions().pageSize,
            take: this.paginationOptions().pageSize,
        });
    }

    onPageChange(event: PageEvent) {
        this.paginationOptions.set({
            pageIndex: event.pageIndex,
            pageSize: event.pageSize,
        });
        this.loadPromoters();
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
}
