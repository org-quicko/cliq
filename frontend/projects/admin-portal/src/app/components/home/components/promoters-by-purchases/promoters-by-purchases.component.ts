import { Component, inject, OnInit, computed, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgIf, NgForOf } from '@angular/common';
import { NgxSkeletonLoaderModule } from "ngx-skeleton-loader";
import { FormatCurrencyPipe } from '@org.quicko.cliq/ngx-core';
import { ProgramStore } from '../../../../store/program.store';
import { PromoterPurchasesStore } from '../dashboard/store/promoter-purchases.store';

@Component({
    selector: 'app-promoters-by-purchases',
    standalone: true,
    templateUrl: './promoters-by-purchases.component.html',
    styleUrls: ['./promoters-by-purchases.component.css'],
    imports: [
        MatIconModule,
        MatCardModule,
        MatButtonModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        NgIf,
        NgForOf,
        NgxSkeletonLoaderModule,
        FormatCurrencyPipe,
    ],
    providers: [PromoterPurchasesStore]
})
export class PromotersByPurchasesComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;
    
    readonly programStore = inject(ProgramStore);
    readonly promoterPurchasesStore = inject(PromoterPurchasesStore);
    private router = inject(Router);

    private scrollListener: (() => void) | null = null;
    private readonly PAGE_SIZE = 20;

    labelColumn = 'Promoters';
    valueColumn = 'Commission';
    alternateValueColumn = 'Revenue by purchases';
    
    // Toggle state: false = Commission, true = Revenue
    showRevenue = signal(false);

    readonly program = computed(() => this.programStore.program());
    readonly programId = computed(() => this.programStore.program()?.programId);

    readonly periodOptions = [
        { value: '7days', label: 'Last 7 days' },
        { value: '30days', label: 'Last 30 days' },
        { value: '3months', label: 'Last 3 months' },
        { value: '6months', label: 'Last 6 months' },
        { value: '1year', label: 'Last 1 year' },
        { value: 'all', label: 'All time' },
    ];

    selectedPeriod = signal<string>('30days');

    ngOnInit() {
        this.fetchData();
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
    }

    getDisplayValue(item: any): number {
        return this.showRevenue() ? (item.revenue ?? 0) : item.value;
    }

    onNavigateToDashboard() {
        const id = this.programId();
        this.router.navigate([`/admin/${id}/home/dashboard`]);
    }

    onPeriodChange(period: string) {
        this.selectedPeriod.set(period);
        this.fetchData();
    }

    getPeriodLabel(value: string): string {
        return this.periodOptions.find(p => p.value === value)?.label || 'Last 30 days';
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

        const threshold = 100; // pixels from bottom to trigger load
        const scrollPosition = container.scrollTop + container.clientHeight;
        const scrollHeight = container.scrollHeight;

        if (scrollHeight - scrollPosition < threshold) {
            this.loadMore();
        }
    }

    private loadMore() {
        if (this.isLoadingMore || !this.hasMore) return;

        const programId = this.programId();
        if (!programId) return;

        const currentCount = this.chartData.length;
        
        this.promoterPurchasesStore.loadMorePromotersByPurchases({
            programId,
            period: this.selectedPeriod(),
            skip: currentCount,
            take: this.PAGE_SIZE,
        });
    }

    private fetchData() {
        const programId = this.programId();
        if (!programId) return;

        this.promoterPurchasesStore.fetchPromotersByPurchases({
            programId,
            period: this.selectedPeriod(),
            skip: 0,
            take: this.PAGE_SIZE,
        });
    }
}
