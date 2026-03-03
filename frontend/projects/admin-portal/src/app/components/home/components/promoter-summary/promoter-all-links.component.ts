import { Component, inject, effect, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { FormatCurrencyPipe, ZeroToDashPipe } from '@org.quicko.cliq/ngx-core';
import { ProgramStore } from '../../../../store/program.store';
import { DateRangeStore } from '../../../../store/date-range.store';
import { PromoterLinksStore } from './store/promoter-links.store';
import { DateRangeFilterComponent } from '../../../layout/range-selector/date-range-filter.component';

@Component({
    selector: 'app-promoter-all-links',
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatPaginatorModule,
        NgxSkeletonLoaderModule,
        FormatCurrencyPipe,
        ZeroToDashPipe,
        DateRangeFilterComponent,
    ],
    providers: [PromoterLinksStore],
    template: 'promoter-all-links.component.html',
    styles: [`:host { display: block; }`],
})
export class PromoterAllLinksComponent implements OnInit {
    readonly promoterLinksStore = inject(PromoterLinksStore);
    readonly programStore = inject(ProgramStore);
    readonly dateRangeStore = inject(DateRangeStore);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    programId!: string;
    promoterId!: string;

    readonly program = this.programStore.program;

    private lastProgramId: string | null = null;
    private lastPromoterId: string | null = null;
    private lastActiveRange: string | null = null;
    private lastStart: string | null = null;
    private lastEnd: string | null = null;

    paginationOptions = signal({
        pageIndex: 0,
        pageSize: 10,
    });

    constructor() {
        effect(() => {
            const activeRange = this.dateRangeStore.activeRange();
            const start = this.dateRangeStore.start();
            const end = this.dateRangeStore.end();

            const startStr = start ? start.toISOString().split('T')[0] : null;
            const endStr = end ? end.toISOString().split('T')[0] : null;

            if (
                this.lastProgramId === this.programId &&
                this.lastPromoterId === this.promoterId &&
                this.lastActiveRange === activeRange &&
                this.lastStart === startStr &&
                this.lastEnd === endStr
            ) {
                return;
            }

            this.lastProgramId = this.programId;
            this.lastPromoterId = this.promoterId;
            this.lastActiveRange = activeRange;
            this.lastStart = startStr;
            this.lastEnd = endStr;

            this.paginationOptions.set({ pageIndex: 0, pageSize: 10 });
            this.loadLinks();
        });
    }

    ngOnInit(): void {
        this.route.params.subscribe((params: Params) => {
            this.promoterId = params['promoter_id'];
        });

        this.route.parent?.parent?.params.subscribe((params: Params) => {
            this.programId = params['program_id'];
        });
    }

    private getPeriodValue(): string {
        const type = this.dateRangeStore.activeRange();
        const periodMap: Record<string, string> = {
            '7': '7days',
            '30': '30days',
            '90': '3months',
            '180': '6months',
            '365': '1year',
            'all': 'all',
            'custom': 'custom',
        };
        return periodMap[type] || '30days';
    }

    loadLinks() {
        const period = this.getPeriodValue();
        const start = this.dateRangeStore.start();
        const end = this.dateRangeStore.end();
        const pagination = this.paginationOptions();

        this.promoterLinksStore.fetchPromoterLinks({
            programId: this.programId,
            promoterId: this.promoterId,
            period,
            skip: pagination.pageIndex * pagination.pageSize,
            take: pagination.pageSize,
            ...(period === 'custom' && start && end ? {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            } : {}),
        });
    }

    onPageChange(event: PageEvent) {
        this.paginationOptions.set({
            pageIndex: event.pageIndex,
            pageSize: event.pageSize,
        });
        this.loadLinks();
    }

    goBackToPromoters() {
        this.router.navigate(['../../../promoters'], { relativeTo: this.route });
    }

    goBackToSummary() {
        this.router.navigate(['..'], { relativeTo: this.route });
    }
}
