import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

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
        NgxSkeletonLoaderModule,
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
    private dataLoaded = false;

    paginationOptions = signal({
        pageIndex: 0,
        pageSize: 10,
    });

    readonly isCircleLoading = this.circleSummaryStore.isLoading;
    readonly isFunctionsLoading = this.circleFunctionsStore.isLoading;

    readonly circleName = this.circleSummaryStore.circleName;
    readonly functions = this.circleFunctionsStore.functions;
    readonly functionsTotal = this.circleFunctionsStore.total;

    readonly program = this.programStore.program;

    ngOnInit(): void {
        // Get circle_id from parent route (circles/:circle_id)
        this.route.parent?.params.subscribe((params: Params) => {
            this.circleId = params['circle_id'];
            this.tryLoadData();
        });

        // Get program_id from ancestor route (/:program_id)
        this.route.parent?.parent?.parent?.params.subscribe((params: Params) => {
            this.programId = params['program_id'];
            this.tryLoadData();
        });
    }

    private tryLoadData() {
        if (this.programId && this.circleId && !this.dataLoaded) {
            this.dataLoaded = true;
            this.loadData();
        }
    }

    private loadData() {
        this.loadCircle();
        this.loadFunctions();
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

    getEffectDisplay(func: any): string {
        if (func.effectType === 'generate_commission') {
            const effect = func.effect as any;
            if (effect?.commission?.commissionType === 'percentage') {
                return `${effect.commission.commissionValue}% Commission`;
            } else if (effect?.commission?.commissionType === 'fixed') {
                const currency = this.program()?.currency || '';
                return `${currency} ${effect.commission.commissionValue} Commission`;
            }
        } else if (func.effectType === 'switch_circle') {
            const effect = func.effect as any;
            return `Switch to ${effect?.targetCircleName || 'Another Circle'}`;
        }
        return func.effectType?.replace('_', ' ');
    }
}
