import { Component, inject, OnInit, computed, signal, effect } from '@angular/core';
import { DatePipe, NgIf, NgForOf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormatCurrencyPipe, Status, ZeroToDashPipe } from '@org.quicko.cliq/ngx-core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ProgramStore } from '../../../../store/program.store';
import { DashboardStore } from './store/dashboard.store';
import { PromoterSignupsStore } from './store/promoter-signups.store';
import { PromoterPurchasesStore } from './store/promoter-purchases.store';
import { DayWiseAnalyticsStore } from './store/day-wise-analytics.store';
import { PopularityChartComponent } from '../../../common/popularity-chart/popularity-chart.component';
import { AnalyticsChartComponent } from '../../../common/analytics-chart/analytics-chart.component';
import { Router } from '@angular/router';

@Component({
	selector: 'app-dashboard',
	standalone: true,
	imports: [
		DatePipe,
		NgIf,
		NgForOf,
		MatCardModule,
		MatDividerModule,
		MatIconModule,
		MatButtonModule,
		MatMenuModule,
		MatTooltipModule,
		FormatCurrencyPipe,
		ZeroToDashPipe,
		NgxSkeletonLoaderModule,
		PopularityChartComponent,
		AnalyticsChartComponent,
	],
	providers: [DashboardStore, PromoterSignupsStore, PromoterPurchasesStore, DayWiseAnalyticsStore],
	templateUrl: './dashboard.component.html',
	styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

	readonly dashboardStore = inject(DashboardStore);
	readonly programStore = inject(ProgramStore);
	readonly promoterSignupsStore = inject(PromoterSignupsStore);
	readonly promoterPurchasesStore = inject(PromoterPurchasesStore);
	readonly dayWiseAnalyticsStore = inject(DayWiseAnalyticsStore);
	private router = inject(Router);

	readonly isAnalyticsLoading = computed(() => this.dashboardStore.analytics().status === Status.LOADING);
	readonly isSignupsLoading = computed(() => this.promoterSignupsStore.isLoading());
	readonly isPurchasesLoading = computed(() => this.promoterPurchasesStore.isLoading());
	readonly isDayWiseLoading = computed(() => this.dayWiseAnalyticsStore.isLoading());

	readonly program = computed(() => this.programStore.program());
	readonly programId = computed(() => this.programStore.program()?.programId);

	readonly analytics = computed(() => this.dashboardStore.analytics().data);
	readonly period = computed(() => this.dashboardStore.analytics().period);
	readonly dayWiseData = computed(() => {
		const data = this.dayWiseAnalyticsStore.dailyData();
		console.log('[Dashboard] Day-wise data received:', data);
		return data;
	});

	readonly signupsPopularityData = computed(() => this.promoterSignupsStore.topPopularityData());
	readonly purchasesPopularityData = computed(() => this.promoterPurchasesStore.topPopularityData());

	readonly today = new Date();

	readonly periodOptions = [
		{ value: '7days', label: 'Last 7 days' },
		{ value: '30days', label: 'Last 30 days' },
		{ value: '3months', label: 'Last 3 months' },
		{ value: '6months', label: 'Last 6 months' },
		{ value: '1year', label: 'Last 1 year' },
		{ value: 'all', label: 'All time' },
	];

	selectedPeriod = signal<string>('30days');

	tooltips = new Map<string, string>([
		['revenue', 'The total value driven through all referral links'],
		['commissions', 'Total commissions earned by promoters'],
		['signups', 'The number of people who signed up using referral links'],
		['purchases', 'The number of purchases made using referral links'],
	]);

	ngOnInit() {
		console.log('[Dashboard] Component initialized, programId:', this.programId());
		this.loadAnalytics();
		this.loadPromoterData();
		this.loadDayWiseAnalytics();
	}

	loadAnalytics() {
		const programId = this.programId();
		if (programId) {
			this.dashboardStore.getProgramAnalytics({
				programId,
				period: this.selectedPeriod(),
			});
		}
	}

	loadDayWiseAnalytics() {
		const programId = this.programId();
		if (programId) {
			console.log('[Dashboard] Fetching day-wise analytics for programId:', programId, 'period:', this.selectedPeriod());
			this.dayWiseAnalyticsStore.fetchDayWiseAnalytics({
				programId,
				period: this.selectedPeriod(),
			});
		}
	}

	loadPromoterData() {
		const programId = this.programId();
		if (programId) {
			this.promoterSignupsStore.fetchPromotersBySignups({
				programId,
				period: this.selectedPeriod(),
				take: 5,
			});
			this.promoterPurchasesStore.fetchPromotersByPurchases({
				programId,
				period: this.selectedPeriod(),
				take: 5,
			});
		}
	}

	onPeriodChange(period: string) {
		this.selectedPeriod.set(period);
		this.loadAnalytics();
		this.loadPromoterData();
		this.loadDayWiseAnalytics();
	}

	getPeriodLabel(value: string): string {
		return this.periodOptions.find(p => p.value === value)?.label || 'Last 30 days';
	}

	getSignupsPromotersLink(): string {
		const programId = this.programId();
		return programId ? `/admin/${programId}/home/promoters-by-signups` : '';
	}

	getPurchasesPromotersLink(): string {
		const programId = this.programId();
		return programId ? `/admin/${programId}/home/promoters-by-purchases` : '';
	}
}
