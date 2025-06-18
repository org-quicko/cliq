import { AfterViewInit, Component, computed, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ReferralStore } from './store/referral.store';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { NgClass, TitleCasePipe } from '@angular/common';
import { ProgramStore } from '../../../../store/program.store';
import { MatRippleModule } from '@angular/material/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormatCurrencyPipe, OrdinalDatePipe, PaginationOptions, referralSortByEnum, sortOrderEnum, Status, ZeroToDashPipe } from '@org.quicko.cliq/ngx-core';
import { SkeletonLoadTableComponent } from '../../../common/skeleton-load-table/skeleton-load-table.component';
import { TableRowStyling } from '../../../../interfaces';
import { LabelChipComponent } from "../../../common/label-chip/label-chip.component";
import { PromoterStore } from '../../../../store/promoter.store';
import { ReferralRow } from '@org-quicko/cliq-sheet-core/Promoter/beans';

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
    FormatCurrencyPipe,
    SkeletonLoadTableComponent,
    LabelChipComponent
],
	providers: [ReferralStore],
	templateUrl: './referrals.component.html',
	styleUrl: './referrals.component.scss'
})
export class ReferralsComponent implements OnInit {

	readonly referralStore = inject(ReferralStore);

	readonly programStore = inject(ProgramStore);
	readonly promoterStore = inject(PromoterStore);

	readonly programId = computed(() => this.programStore.program()!.programId);
	readonly promoterId = computed(() => this.promoterStore.promoter()!.promoterId);

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

	sortOptions = signal<{ active: 'updated at', direction: 'asc' | 'desc' }>({
		active: 'updated at',
		direction: 'desc',
	});

	paginationOptions = signal<PaginationOptions>({
		pageIndex: 0,
		pageSize: 5,
	});

	referralCellLength = 'w-[25%]';
	commissionCellLength = 'w-[14%]';
	revenueCellLength = 'w-[14%]';
	updatedAtCellLength = 'w-[33%]';
	statusCellLength = 'w-[14%]';

	headersStyling: TableRowStyling[] = [
		{
			parentTheme: `${this.referralCellLength} min-w-[260px] flex justify-start`,
			theme: { width: '90px' }
		},
		{
			parentTheme: `${this.commissionCellLength}  flex justify-center`,
			theme: { width: '130px' }
		},
		{
			parentTheme: `${this.revenueCellLength} min-w-[200px] flex justify-center`,
			theme: { width: '130px' }
		},
		{
			parentTheme: `${this.updatedAtCellLength} min-w-[260px] flex justify-center`,
			theme: { width: '130px' }
		},
		{
			parentTheme: `${this.statusCellLength} min-w-[200px] flex justify-center`,
			theme: { width: '90px' }
		},
	];

	rowsStyling: TableRowStyling[] = [
		{
			parentTheme: `${this.referralCellLength} flex justify-start`,
			theme: { width: '100px' }
		},
		{
			parentTheme: `${this.commissionCellLength} flex justify-center`,
			theme: { width: '100px' }
		},
		{
			parentTheme: `${this.revenueCellLength} flex justify-center`,
			theme: { width: '130px' }
		},
		{
			parentTheme: `${this.updatedAtCellLength} flex justify-center`,
			theme: { width: '250px' }
		},
		{
			parentTheme: `${this.statusCellLength} flex justify-center`,
			theme: { width: '100px' }
		},
	];

	constructor(private router: Router, private route: ActivatedRoute) {
		effect(() => {
			const referralRows = (this.referralStore.referrals()?.getRows() ?? []) as ReferralRow[];

			const { pageIndex, pageSize } = this.paginationOptions();

			const start = pageIndex * pageSize;
			const end = Math.min(start + pageSize, referralRows.length);

			this.dataSource.data = referralRows.slice(start, end);
		});
	}

	ngOnInit(): void {
		this.referralStore.resetLoadedPages();
		this.loadReferrals();
	}

	loadReferrals(isSorting: boolean = false) {
		const { pageIndex, pageSize } = this.paginationOptions();
		const skip = pageIndex * pageSize;

		this.referralStore.getPromoterReferrals({
			sortBy: referralSortByEnum.UPDATED_AT ,
			sortOrder: this.sortOptions().direction === 'asc' ? sortOrderEnum.ASCENDING : sortOrderEnum.DESCENDING,
			skip,
			take: pageSize,
			isSorting,

			programId: this.programId(),
			promoterId: this.promoterId()

		});
	}

	onSortChange(event: Sort) {
		this.paginationOptions.set({ pageSize: 5, pageIndex: 0 });
		this.referralStore.resetLoadedPages();
		this.sortOptions.set({ active: event.active as 'updated at', direction: event.direction as 'asc' | 'desc' });

		this.loadReferrals(true);
	}

	onPageChange(event: PageEvent) {
		this.paginationOptions.set({ pageIndex: event.pageIndex, pageSize: event.pageSize });
		this.loadReferrals();
	}

	onSearch() {
	}

	onClear() {
		this.email.set('');
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

	onClickReferral(contactId: string) {
		this.router.navigate([`./referrals/${contactId}/commissions`], { relativeTo: this.route });
	}

	convertToReferralRow(row: any[]) {
		return new ReferralRow(row);
	}

}
