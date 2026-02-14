import { Component, inject, OnInit, computed, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy, effect } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgIf, NgForOf } from '@angular/common';
import { NgxSkeletonLoaderModule } from "ngx-skeleton-loader";
import { FormatCurrencyPipe } from '@org.quicko.cliq/ngx-core';
import { ProgramStore } from '../../../../store/program.store';
import { PromoterPurchasesStore } from '../dashboard/store/promoter-purchases.store';
import { DateRangeFilterComponent } from '../../../layout/range-selector/date-range-filter.component';
import { DateRangeStore } from '../../../../store/date-range.store';

@Component({
    selector: 'app-promoters-by-purchases',
    standalone: true,
    templateUrl: './promoters-by-purchases.component.html',
    styleUrls: ['./promoters-by-purchases.component.css'],
    imports: [
        MatIconModule,
        MatCardModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        NgIf,
        NgForOf,
        NgxSkeletonLoaderModule,
        FormatCurrencyPipe,
        DateRangeFilterComponent,
    ],
    providers: [PromoterPurchasesStore]
})
export class PromotersByPurchasesComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;
    
    readonly programStore = inject(ProgramStore);
    readonly promoterPurchasesStore = inject(PromoterPurchasesStore);
    readonly dateRangeStore = inject(DateRangeStore);
    private router = inject(Router);

    private scrollListener: (() => void) | null = null;
    private readonly PAGE_SIZE = 20;

    labelColumn = 'Promoters';
    valueColumn = 'Commission';
    alternateValueColumn = 'Revenue';

    showRevenue = signal(false);

    readonly program = computed(() => this.programStore.program());
    readonly programId = computed(() => this.programStore.program()?.programId);

    constructor() {
        effect(() => {
            const programId = this.programId();
            if (!programId) return; 

            const activeRange = this.dateRangeStore.activeRange();
            const start = this.dateRangeStore.start();
            const end = this.dateRangeStore.end();

       
            this.fetchDataWithDateRange();
        });
    }

    ngOnInit() {
        // fetchData is handled by the effect above
    }

    ngAfterViewInit() {
        this.setupScrollListener();
    }

    ngOnDestroy() {
        this.removeScrollListener();
    }

    get chartData() {
        return this.promoterPurchasesStore.popularityData() ?? [];
    }

    get maxValue() {
        if (this.chartData.length === 0) return 0;
        return this.showRevenue()
            ? Math.max(...this.chartData.map(d => d.revenue ?? 0))
            : Math.max(...this.chartData.map(d => d.value));
    }

    get isLoading() {
        return this.promoterPurchasesStore.isLoading();
    }

    get isLoadingMore() {
        return this.promoterPurchasesStore.isLoadingMore();
    }

    get hasMore() {
        return this.promoterPurchasesStore.hasMore();
    }

    get currency() {
        return this.program()?.currency || 'INR';
    }

    get displayedValueColumn(): string {
        return this.showRevenue() ? this.alternateValueColumn : this.valueColumn;
    }

    toggleValueType() {
        this.showRevenue.update(v => !v);
        // Re-fetch with new sort order
        this.fetchDataWithDateRange();
    }

    getDisplayValue(item: any): number {
        return this.showRevenue() ? (item.revenue ?? 0) : item.value;
    }

    onNavigateToDashboard() {
        const id = this.programId();
        this.router.navigate([`/${id}/home/dashboard`]);
    }

    onDateRangeApplied() {
        this.fetchDataWithDateRange();
    }

    getBarWidth(item: any): number {
        const value = this.getDisplayValue(item);
        return this.maxValue > 0 ? (value / this.maxValue) * 100 : 0;
    }

    private setupScrollListener() {
        setTimeout(() => {
            const container = this.scrollContainer?.nativeElement;
            if (container) {
                this.scrollListener = () => this.onScroll();
                container.addEventListener('scroll', this.scrollListener);
            }
        });
    }

    private removeScrollListener() {
        const container = this.scrollContainer?.nativeElement;
        if (container && this.scrollListener) {
            container.removeEventListener('scroll', this.scrollListener);
        }
    }

    private onScroll() {
        const container = this.scrollContainer?.nativeElement;
        if (!container) return;

        const threshold = 100; 
        const scrollPosition = container.scrollTop + container.clientHeight;
        const scrollHeight = container.scrollHeight;

        console.log('Scroll event:', { scrollPosition, scrollHeight, diff: scrollHeight - scrollPosition, threshold });

        if (scrollHeight - scrollPosition < threshold) {
            this.loadMore();
        }
    }

    private loadMore() {
        console.log('loadMore called', {
            isLoadingMore: this.isLoadingMore,
            hasMore: this.hasMore,
            programId: this.programId(),
            chartDataLength: this.chartData.length
        });

        if (this.isLoadingMore || !this.hasMore) return;

        const programId = this.programId();
        if (!programId) return;

        const currentCount = this.chartData.length;
        const start = this.dateRangeStore.start();
        const end = this.dateRangeStore.end();
        
        this.promoterPurchasesStore.loadMorePromotersByPurchases({
            programId,
            sortBy: this.showRevenue() ? 'revenue' : 'purchase_commission',
            period: this.getPeriodValue(),
            startDate: start ? start.toISOString().split('T')[0] : undefined,
            endDate: end ? end.toISOString().split('T')[0] : undefined,
            skip: currentCount,
            take: this.PAGE_SIZE,
        });
    }

    private fetchData() {
        const programId = this.programId();
        if (!programId) return;

        this.promoterPurchasesStore.fetchPromotersByPurchases({
            programId,
            sortBy: this.showRevenue() ? 'revenue' : 'purchase_commission',
            period: this.getPeriodValue(),
            skip: 0,
            take: this.PAGE_SIZE,
        });
    }

    private fetchDataWithDateRange() {
        const programId = this.programId();
        if (!programId) return;

        const start = this.dateRangeStore.start();
        const end = this.dateRangeStore.end();

        this.promoterPurchasesStore.fetchPromotersByPurchases({
            programId,
            sortBy: this.showRevenue() ? 'revenue' : 'purchase_commission',
            period: this.getPeriodValue(),
            startDate: start ? start.toISOString().split('T')[0] : undefined,
            endDate: end ? end.toISOString().split('T')[0] : undefined,
            skip: 0,
            take: this.PAGE_SIZE,
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
            'custom': 'custom'
        };
        return periodMap[type] || '30days';
    }
}
