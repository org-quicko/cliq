import { Component, effect, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { MemberStore } from '../../store/member.store';
import { ProgramStore } from '../../store/program.store';
import { PromoterStore } from '../../store/promoter.store';
import { HeaderComponent } from './components/header/header.component';
import { SideNavComponent } from './components/side-nav/side-nav.component';
import { CommissionStore } from './store/commission.store';

@Component({
	selector: 'app-home',
	imports: [HeaderComponent, SideNavComponent, RouterOutlet],
	providers: [CommissionStore],
	templateUrl: './home.component.html',
	styleUrl: './home.component.scss',
	standalone: true,
})
export class HomeComponent implements OnInit {

	readonly memberStore = inject(MemberStore);

	readonly programStore = inject(ProgramStore);

	readonly promoterStore = inject(PromoterStore);

	readonly commissionStore = inject(CommissionStore);

	constructor(
		private router: Router,
		private route: ActivatedRoute,
	) {
		effect(() => {
			// console.log(this.promoterStore.promoter());
			// console.log(this.memberStore.member());
			// console.log(this.commissionStore.commissions());
		});
	}

	ngOnInit() {
		this.commissionStore.getPromoterCommissions();
	}
}
