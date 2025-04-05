import { NgClass, TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ProgramStore } from '../../../../../../store/program.store';
import { ActivatedRoute, Router } from '@angular/router';
import { LinkCommissionsStore } from './store/linkCommission.store';
import { CommissionRow } from '@org.quicko.cliq/ngx-core/generated/sources/Promoter';
import { FormatCurrencyPipe, OrdinalDatePipe, Status, ZeroToDashPipe } from '@org.quicko.cliq/ngx-core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@Component({
	selector: 'app-link-commissions',
	imports: [
		MatIconModule,
		MatInputModule,
		MatButtonModule,
		MatTableModule,
		FormsModule,
		MatFormFieldModule,
		MatSortModule,
		MatChipsModule,
		MatRippleModule,
		NgClass,
		TitleCasePipe,
		OrdinalDatePipe,
		FormatCurrencyPipe
	],
	providers: [LinkCommissionsStore],
	templateUrl: './link-commissions.component.html',
	styleUrl: './link-commissions.component.scss'
})
export class LinkCommissionsComponent implements OnInit {

	@ViewChild(MatSort) sort: MatSort;

	displayedColumns: string[] = ['created at', 'referral', 'type', 'commission', 'revenue'];

	dataSource: MatTableDataSource<CommissionRow> = new MatTableDataSource<CommissionRow>([]);

	readonly programStore = inject(ProgramStore);

	readonly linkCommissionsStore = inject(LinkCommissionsStore);

	readonly link = computed(() => this.linkCommissionsStore.link());

	fullLinkString = computed(() => this.program()?.website + '?ref=' + this.link()?.refVal);

	readonly program = computed(() => this.programStore.program());

	referralKeyType = computed(() => this.programStore.program()?.referralKeyType);

	referralKey = signal('');

	readonly isLoading = computed(() => this.linkCommissionsStore.status() === Status.LOADING);

	linkCommissionsLength = computed(() => {
		const commissions = this.linkCommissionsStore.commissions();
		return commissions ? commissions.length() : 0;
	});

	constructor(private router: Router, private route: ActivatedRoute) {
		effect(() => {
			const linkCommissions = (this.linkCommissionsStore.commissions()?.getRows() ?? []) as CommissionRow[];
			this.dataSource.data = linkCommissions;
		});
	}

	ngOnInit(): void {
		const linkId = this.route.snapshot.paramMap.get('link_id');
		if (linkId) {
			this.linkCommissionsStore.getLinkCommissions({ linkId });
			this.linkCommissionsStore.getLink({ linkId });
		} else {
			console.error('No link_id found in route.');
		}
	}

	onGoBack() {
		this.router.navigate([`../../../`], { relativeTo: this.route });
	}

	onSearch() {
		console.log('searching for', this.referralKey());
	}

	onClear() {
		this.referralKey.set('');
		console.log('referralKey reset', this.referralKey());
	}

	convertToCommissionRow(row: any[]) {
		return new CommissionRow(row);
	}
}
