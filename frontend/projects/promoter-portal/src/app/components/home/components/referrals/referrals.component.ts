import { AfterViewInit, Component, computed, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ReferralStore } from './store/referral.store';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { NgClass, TitleCasePipe } from '@angular/common';
import { ProgramStore } from '../../../../store/program.store';
import { MatRippleModule } from '@angular/material/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReferralRow } from '@org.quicko.cliq/ngx-core/generated/sources/Promoter';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormatCurrencyPipe, OrdinalDatePipe, referralSortByEnum, sortOrderEnum, Status, ZeroToDashPipe } from '@org.quicko.cliq/ngx-core';

@Component({
	selector: 'app-referrals',
	imports: [
		MatFormFieldModule,
		MatInputModule,
		FormsModule,
		MatButtonModule,
		MatIconModule,
		MatTableModule,
		MatSortModule,
		MatChipsModule,
		MatRippleModule,
		MatPaginatorModule,
		NgClass,
		TitleCasePipe,
		OrdinalDatePipe,
		FormatCurrencyPipe
	],
	providers: [ReferralStore],
	templateUrl: './referrals.component.html',
	styleUrl: './referrals.component.scss'
})
export class ReferralsComponent implements OnInit, AfterViewInit {

	readonly referralStore = inject(ReferralStore);

	readonly programStore = inject(ProgramStore);

	readonly program = computed(() => this.programStore.program());

	@ViewChild(MatPaginator) paginator: MatPaginator;

	@ViewChild(MatSort) sort: MatSort;

	email = signal('');

	displayedColumns = ['referral', 'commission', 'revenue', 'updated at', 'status'];

	dataSource: MatTableDataSource<ReferralRow> = new MatTableDataSource<ReferralRow>([]);

	totalDataLength = computed(() => {
		const metadata = this.referralStore.referrals()?.getMetadata();
		const count = metadata ? metadata.get('count') : null;
		return count ? Number(count) : 0; // Returns 0 if count is undefined
	});

	readonly isLoading = computed(() => this.referralStore.status() === Status.LOADING);

	readonly referralsLength = computed(() => {
		const referrals = this.referralStore.referrals();
		return referrals ? referrals.length() : 0;
	});

	skip = this.referralStore.skip;

	take = this.referralStore.take;

	constructor(private router: Router, private route: ActivatedRoute) {
		effect(() => {
			const referralRows = (this.referralStore.referrals()?.getRows() ?? []) as ReferralRow[];
			this.dataSource.data = referralRows;
			if (this.paginator) {
				this.paginator.length = this.referralStore.rowsLength();
			}
		});
	}

	ngOnInit(): void {
		this.referralStore.getPromoterReferrals({
			sortBy: referralSortByEnum.UPDATED_AT,
			sortOrder: sortOrderEnum.DESCENDING,
		});
	}

	ngAfterViewInit(): void {
		this.dataSource.sort = this.sort;
		this.dataSource.paginator = this.paginator;
		this.dataSource.sort.sortChange.subscribe(() => {
			this.paginator.pageIndex = 0;
			this.referralStore.getPromoterReferrals({
				sortBy: referralSortByEnum.UPDATED_AT,
				sortOrder: this.sort.direction === 'asc' ? sortOrderEnum.ASCENDING : sortOrderEnum.DESCENDING,
			});
		});
	}

	onSearch() {
		console.log('searching for', this.email());
	}

	onClear() {
		this.email.set('');
		console.log('email reset', this.email());
	}

	onPageChange(event: PageEvent) {
		this.referralStore.getPromoterReferrals({
			skip: event.pageIndex * event.pageSize,
			take: event.pageSize,
		});
	}

	getCellValue(row: any[], column: string): any {
		const referralRow = this.convertToReferralRow(row);

		switch (column) {
			case 'referral': return referralRow.getContactInfo();
			case 'commission': return referralRow.getTotalCommission();
			case 'revenue': return Number(referralRow.getTotalRevenue()) === 0 ? '-' : referralRow.getTotalRevenue();
			case 'updated at': return referralRow.getUpdatedAt();
			case 'status': return referralRow.getStatus();
			case 'contact id': return referralRow.getContactId();
			default: return ''; // Handle unknown columns
		}
	}

	onClickReferral(contactId: string, contactInfo: string) {
		this.router.navigate([`./referrals/${contactId}/commissions`], { relativeTo: this.route });
	}

	convertToReferralRow(row: any[]) {
		return new ReferralRow(row);
	}

}
