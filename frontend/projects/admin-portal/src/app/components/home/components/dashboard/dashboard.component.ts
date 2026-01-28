import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
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

@Component({
	selector: 'app-dashboard',
	standalone: true,
	imports: [
		DatePipe,
		MatCardModule,
		MatDividerModule,
		MatIconModule,
		MatButtonModule,
		MatMenuModule,
		MatTooltipModule,
		FormatCurrencyPipe,
		ZeroToDashPipe,
		NgxSkeletonLoaderModule,
	],
	providers: [DashboardStore],
	templateUrl: './dashboard.component.html',
	styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

	readonly dashboardStore = inject(DashboardStore);
	readonly programStore = inject(ProgramStore);

	readonly isAnalyticsLoading = computed(() => this.dashboardStore.analytics().status === Status.LOADING);

	readonly program = computed(() => this.programStore.program());
	readonly programId = computed(() => this.programStore.program()?.programId);

	readonly analytics = computed(() => this.dashboardStore.analytics().data);
	readonly period = computed(() => this.dashboardStore.analytics().period);

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
		this.loadAnalytics();
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

	onPeriodChange(period: string) {
		this.selectedPeriod.set(period);
		this.loadAnalytics();
	}

	getPeriodLabel(value: string): string {
		return this.periodOptions.find(p => p.value === value)?.label || 'Last 30 days';
	}
}
