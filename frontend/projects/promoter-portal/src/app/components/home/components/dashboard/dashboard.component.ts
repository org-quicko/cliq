import { Component, inject, OnInit, effect, computed } from '@angular/core';
import { LinkStore } from './store/link.store';
import { JsonPipe } from '@angular/common';
import { PromoterStatsStore } from './store/promoter-stats.store';
import { MatCardModule } from '@angular/material/card';
import { CommissionStore } from '../../store/commission.store';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	imports: [MatCardModule],
	providers: [LinkStore, PromoterStatsStore],
	styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

	readonly linkStore = inject(LinkStore);

	readonly promoterStatsStore = inject(PromoterStatsStore);

	readonly commissionStore = inject(CommissionStore);

	readonly statistics = computed(() => {

	});

	constructor() {
		effect(() => {
			// console.log("Effect Triggered: Links Updated:", this.linkStore.links());
			// console.log("Effect Triggered: Promoter Statistics Updated:", this.promoterStatsStore.statistics());
			// console.log(this.promoterStatsStore.statistics()?.getRows());
			// console.log(this.commissionStore.commissions());
		});
	}

	ngOnInit() {
		this.linkStore.getPromoterLinks(); // Ensure async operation completes
		this.promoterStatsStore.getPromoterStats();
	}
}
