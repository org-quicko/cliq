import { Component, inject, effect, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { FormatCurrencyPipe, ZeroToDashPipe, OrdinalDatePipe } from '@org.quicko.cliq/ngx-core';
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
        OrdinalDatePipe,
    ],
    providers: [PromoterLinksStore],
    templateUrl: 'promoter-all-links.component.html',
    styleUrl: `promoter-all-links.component.css`,
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

    private lastStart: string | null | undefined = undefined;
    private lastEnd: string | null | undefined = undefined;

    paginationOptions = signal({
        pageIndex: 0,
        pageSize: 10,
    });

    sortOrder = signal<'ASC' | 'DESC'>('DESC');

    constructor() {
        effect(() => {
            const start = this.dateRangeStore.start();
            const end = this.dateRangeStore.end();

            const startStr = start ? start.toISOString().split('T')[0] : null;
            const endStr = end ? end.toISOString().split('T')[0] : null;

            if (

                this.lastStart === startStr &&
                this.lastEnd === endStr
            ) {
                return;
            }

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
        const sortOrder = this.sortOrder();

        this.promoterLinksStore.fetchPromoterLinks({
            programId: this.programId,
            promoterId: this.promoterId,
            period,
            skip: pagination.pageIndex * pagination.pageSize,
            take: pagination.pageSize,
            sortOrder,
            ...(period === 'custom' && start && end ? {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            } : {}),
        });
    }

    toggleSortOrder() {
        this.sortOrder.set(this.sortOrder() === 'ASC' ? 'DESC' : 'ASC');
        this.paginationOptions.set({ pageIndex: 0, pageSize: this.paginationOptions().pageSize });
        this.loadLinks();
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
