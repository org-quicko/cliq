import { Component, inject, computed, effect, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { FormatCurrencyPipe, ZeroToDashPipe, OrdinalDatePipe } from '@org.quicko.cliq/ngx-core';
import { ProgramStore } from '../../../../store/program.store';
import { DateRangeStore } from '../../../../store/date-range.store';
import { PromoterSummaryStore } from './store/promoter-summary.store';
import { PromoterLinksStore } from './store/promoter-links.store';
import { AnalyticsChartComponent } from '../../../common/analytics-chart/analytics-chart.component';
import { DateRangeFilterComponent } from '../../../layout/range-selector/date-range-filter.component';

@Component({
    selector: 'app-promoter-summary',
    standalone: true,
    imports: [
        CommonModule,
        MatDividerModule,
        MatIconModule,
        MatTooltipModule,
        NgxSkeletonLoaderModule,
        FormatCurrencyPipe,
        ZeroToDashPipe,
        AnalyticsChartComponent,
        DateRangeFilterComponent,
        OrdinalDatePipe,
    ],
    providers: [PromoterSummaryStore, PromoterLinksStore],
    templateUrl: './promoter-summary.component.html',
    styleUrl: './promoter-summary.component.css',
})
export class PromoterSummaryComponent implements OnInit {
    readonly promoterSummaryStore = inject(PromoterSummaryStore);
    readonly promoterLinksStore = inject(PromoterLinksStore);
    readonly programStore = inject(ProgramStore);
    readonly dateRangeStore = inject(DateRangeStore);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    programId!: string;
    promoterId!: string;

    private lastProgramId: string | null = null;
    private lastPromoterId: string | null = null;
    private lastActiveRange: string | null = null;
    private lastStart: string | null = null;
    private lastEnd: string | null = null;

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

            this.loadAllData();
        });
    }
    readonly isAnalyticsLoading = this.promoterSummaryStore.isLoading;
    readonly isLinksLoading = this.promoterLinksStore.isLoading;

    readonly program = this.programStore.program;

    readonly analytics = computed(() => this.promoterSummaryStore.analytics().summaryRow);
    readonly promoterName = this.promoterSummaryStore.promoterName;

    readonly period = computed(() => this.promoterSummaryStore.analytics().period ?? '30days');
    readonly dayWiseData = computed(() => {
        const rows = this.promoterSummaryStore.analytics().dailyRows;

        return rows.map(row => ({
            date: row.getDate() ?? '',
            signups: Number(row.getSignups() ?? 0),
            purchases: Number(row.getPurchases() ?? 0),
            revenue: Number(row.getRevenue() ?? 0),
            commission: Number(row.getCommission() ?? 0),
            signupCommission: Number(row.getSignupCommission() ?? 0),
            purchaseCommission: Number(row.getPurchaseCommission() ?? 0),
        }));
    });
    readonly dataType = computed(() => this.promoterSummaryStore.analytics().dataType ?? 'daily');

    readonly links = this.promoterLinksStore.links;
    readonly linksTotal = this.promoterLinksStore.total;

    sortOrder = signal<'ASC' | 'DESC'>('DESC');

    tooltips = new Map<string, string>([
        ['revenue', 'Total sales from orders made using this promoter\'s referral link'],
        ['commissions', 'Commission this promoter has earned'],
        ['signups', 'People who signed up using this promoter\'s referral link'],
        ['purchases', 'Orders completed through this promoter\'s referral link'],
    ]);

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

    private loadAllData() {
        this.loadAnalytics();
        this.loadLinks();
    }

    loadAnalytics() {
        const period = this.getPeriodValue();
        const start = this.dateRangeStore.start();
        const end = this.dateRangeStore.end();

        this.promoterSummaryStore.getPromoterSummaryAnalytics({
            programId: this.programId,
            promoterId: this.promoterId,
            period,
            ...(period === 'custom' && start && end ? {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            } : {}),
        });
    }

    loadLinks() {
        const period = this.getPeriodValue();
        const start = this.dateRangeStore.start();
        const end = this.dateRangeStore.end();
        const sortOrder = this.sortOrder();

        this.promoterLinksStore.fetchPromoterLinks({
            programId: this.programId,
            promoterId: this.promoterId,
            period,
            skip: 0,
            take: 5,
            sortOrder,
            ...(period === 'custom' && start && end ? {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            } : {}),
        });
    }

    toggleSortOrder() {
        this.sortOrder.set(this.sortOrder() === 'ASC' ? 'DESC' : 'ASC');
        this.loadLinks();
    }

    viewAllLinks() {
        this.router.navigate(['links'], { relativeTo: this.route });
    }

    goBack() {
        this.router.navigate(['../../promoters'], { relativeTo: this.route });
    }
}
