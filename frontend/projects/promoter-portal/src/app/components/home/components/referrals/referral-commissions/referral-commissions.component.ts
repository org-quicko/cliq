import { Component, computed, effect, inject, OnInit, ViewChild } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ReferralCommissionsStore } from './store/referralCommissions.store';
import { CommissionRow } from '@org.quicko.cliq/ngx-core/generated/sources/Promoter';
import { FormatCurrencyPipe, OrdinalDatePipe } from '@org.quicko.cliq/ngx-core';
import { MatButtonModule } from '@angular/material/button';
import { ProgramStore } from '../../../../../store/program.store';

@Component({
	selector: 'app-referral-commissions',
	imports: [
		MatIconModule,
		MatButtonModule,
		MatTableModule,
		MatSortModule,
		MatChipsModule,
		MatRippleModule,
		TitleCasePipe,
		OrdinalDatePipe,
		FormatCurrencyPipe,
	],
	providers: [ReferralCommissionsStore],
	templateUrl: './referral-commissions.component.html',
	styleUrl: './referral-commissions.component.scss'
})
export class ReferralCommissionsComponent implements OnInit {
	@ViewChild(MatSort) sort: MatSort;

	displayedColumns: string[] = ['created at', 'type', 'commission', 'revenue'];

	dataSource: MatTableDataSource<CommissionRow> = new MatTableDataSource<CommissionRow>([]);

	readonly programStore = inject(ProgramStore);

	readonly referralCommissionsStore = inject(ReferralCommissionsStore);

	readonly contact = computed(() => this.referralCommissionsStore.contact());

	readonly currency = computed(() => this.programStore.program()?.currency);

	constructor(private router: Router, private route: ActivatedRoute) {
		effect(() => {
			const referralCommissions = (this.referralCommissionsStore.commissions()?.getRows() ?? []) as CommissionRow[];
			this.dataSource.data = referralCommissions;
		});
	}

	ngOnInit(): void {
		const contactId = this.route.snapshot.paramMap.get('contact_id');
		if (contactId) {
			this.referralCommissionsStore.getReferralCommissions({ contactId });
			this.referralCommissionsStore.getReferral({ contactId });
		} else {
			console.error('No contact_id found in route.');
		}
	}

	onGoBack() {
		this.router.navigate([`../../../`], { relativeTo: this.route });
	}

	convertToCommissionRow(row: any[]) {
		return new CommissionRow(row);
	}

}
