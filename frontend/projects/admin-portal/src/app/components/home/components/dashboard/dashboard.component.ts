import { Component, inject, OnInit, computed, effect, signal } from '@angular/core';
import { DatePipe, NgIf} from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormatCurrencyPipe, ZeroToDashPipe } from '@org.quicko.cliq/ngx-core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ProgramStore } from '../../../../store/program.store';
import { DateRangeStore } from '../../../../store/date-range.store';
import { DashboardStore } from './store/dashboard.store';
import { PromoterSignupsStore } from './store/promoter-signups.store';
import { PromoterPurchasesStore } from './store/promoter-purchases.store';
import { PopularityChartComponent } from '../../../common/popularity-chart/popularity-chart.component';
import { AnalyticsChartComponent } from '../../../common/analytics-chart/analytics-chart.component';
import { DateRangeFilterComponent } from '../../../layout/range-selector/date-range-filter.component';
import { Router } from '@angular/router';

@Component({
	selector: 'app-dashboard',
	standalone: true,
	imports: [
		DatePipe,
		NgIf,
		MatCardModule,
		MatDividerModule,
		MatIconModule,
		MatButtonModule,
		MatTooltipModule,
		FormatCurrencyPipe,
		ZeroToDashPipe,
		NgxSkeletonLoaderModule,
		PopularityChartComponent,
		AnalyticsChartComponent,
		DateRangeFilterComponent,
	],
	providers: [DashboardStore, PromoterSignupsStore, PromoterPurchasesStore],
	templateUrl: './dashboard.component.html',
	styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

	readonly dashboardStore = inject(DashboardStore);
	readonly programStore = inject(ProgramStore);
	readonly dateRangeStore = inject(DateRangeStore);
	readonly promoterSignupsStore = inject(PromoterSignupsStore);
	readonly promoterPurchasesStore = inject(PromoterPurchasesStore);
	private router = inject(Router);

	// For infinite-loop prevention
	private lastProgramId: string | null = null;
	private lastActiveRange: string | null = null;
	private lastStart: string | null = null;
	private lastEnd: string | null = null;

	constructor() {
		effect(() => {
			const programId = this.programId();
			if (!programId) return;

			const activeRange = this.dateRangeStore.activeRange();
			const start = this.dateRangeStore.start();
			const end = this.dateRangeStore.end();

			const startStr = start ? start.toISOString().split('T')[0] : null;
			const endStr = end ? end.toISOString().split('T')[0] : null;

			// Prevent infinite loops - only fetch if something actually changed
			if (
				this.lastProgramId === programId &&
				this.lastActiveRange === activeRange &&
				this.lastStart === startStr &&
				this.lastEnd === endStr
			) {
				return;
			}

			// Update references
			this.lastProgramId = programId;
			this.lastActiveRange = activeRange;
			this.lastStart = startStr;
			this.lastEnd = endStr;

			this.loadAllData();
		});
	}

	readonly isAnalyticsLoading = computed(() => this.dashboardStore.isLoading());
	readonly isSignupsLoading = computed(() => this.promoterSignupsStore.isLoading());
	readonly isPurchasesLoading = computed(() => this.promoterPurchasesStore.isLoading());

	readonly program = computed(() => this.programStore.program());
	readonly programId = computed(() => this.programStore.program()?.programId);

	readonly analytics = computed(() => this.dashboardStore.analytics().data);
	readonly period = computed(() => this.dashboardStore.analytics().period ?? '30days');
	readonly dayWiseData = computed(() => this.dashboardStore.analytics().dailyData);
	readonly dataType = computed(() => this.dashboardStore.analytics().dataType ?? 'daily');

	readonly signupsPopularityData = computed(() => this.promoterSignupsStore.topPopularityData());
	readonly purchasesPopularityData = computed(() => this.promoterPurchasesStore.topPopularityData());

	// Track toggle states to preserve across re-renders
	showSignupsAlternate = signal(false);
	showPurchasesAlternate = signal(false);

	readonly today = new Date();

	tooltips = new Map<string, string>([
		['revenue', 'The total value driven through all referral links'],
		['commissions', 'Total commissions earned by promoters'],
		['signups', 'The number of people who signed up using referral links'],
		['purchases', 'The number of purchases made using referral links'],
	]);

	ngOnInit() {
	}

	/**
	 * Convert DateRangeStore type to backend period format
	 * Backend expects: '7days', '30days', '3months', '6months', '1year', 'all'
	 */
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

	private loadAllData() {
		this.loadAnalytics();
		this.loadPromoterData();
	}

	loadAnalytics() {
		const programId = this.programId();
		if (programId) {
			const period = this.getPeriodValue();
			const start = this.dateRangeStore.start();
			const end = this.dateRangeStore.end();
			
			this.dashboardStore.getProgramAnalytics({
				programId,
				period,
				// Pass custom dates for 'custom' range
				...(period === 'custom' && start && end ? {
					startDate: start.toISOString(),
					endDate: end.toISOString(),
				} : {}),
			});
		}
	}

	loadPromoterData() {
		const programId = this.programId();
		if (programId) {
			const period = this.getPeriodValue();
			const start = this.dateRangeStore.start();
			const end = this.dateRangeStore.end();
			
			this.promoterSignupsStore.fetchPromotersBySignups({
				programId,
				sortBy: 'signup_commission',
				period,
				take: 5,
				...(period === 'custom' && start && end ? {
					startDate: start.toISOString(),
					endDate: end.toISOString(),
				} : {}),
			});
			this.promoterPurchasesStore.fetchPromotersByPurchases({
				programId,
				sortBy: 'purchase_commission',
				period,
				take: 5,
				...(period === 'custom' && start && end ? {
					startDate: start.toISOString(),
					endDate: end.toISOString(),
				} : {}),
			});
		}
	}

	/**
	 * Handle toggle for signups chart - re-fetch with new sort order
	 * @param showAlternate - true = sort by signups count, false = sort by signup_commission
	 */
	onSignupsToggle(showAlternate: boolean) {
		this.showSignupsAlternate.set(showAlternate);
		const programId = this.programId();
		if (!programId) return;

		const period = this.getPeriodValue();
		const start = this.dateRangeStore.start();
		const end = this.dateRangeStore.end();

		this.promoterSignupsStore.fetchPromotersBySignups({
			programId,
			sortBy: showAlternate ? 'signups' : 'signup_commission',
			period,
			take: 5,
			...(period === 'custom' && start && end ? {
				startDate: start.toISOString(),
				endDate: end.toISOString(),
			} : {}),
		});
	}

	/**
	 * Handle toggle for purchases chart - re-fetch with new sort order
	 * @param showAlternate - true = sort by revenue, false = sort by purchase_commission
	 */
	onPurchasesToggle(showAlternate: boolean) {
		this.showPurchasesAlternate.set(showAlternate);
		const programId = this.programId();
		if (!programId) return;

		const period = this.getPeriodValue();
		const start = this.dateRangeStore.start();
		const end = this.dateRangeStore.end();

		this.promoterPurchasesStore.fetchPromotersByPurchases({
			programId,
			sortBy: showAlternate ? 'revenue' : 'purchase_commission',
			period,
			take: 5,
			...(period === 'custom' && start && end ? {
				startDate: start.toISOString(),
				endDate: end.toISOString(),
			} : {}),
		});
	}

	getSignupsPromotersLink(): string {
		const programId = this.programId();
		return programId ? `/${programId}/home/promoters-by-signups` : '';
	}

	getPurchasesPromotersLink(): string {
		const programId = this.programId();
		return programId ? `/${programId}/home/promoters-by-purchases` : '';
	}
}
