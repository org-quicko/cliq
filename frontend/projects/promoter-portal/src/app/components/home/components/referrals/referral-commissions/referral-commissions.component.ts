import { Component, computed, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ReferralCommissionsStore } from './store/referralCommissions.store';
import { commissionSortByEnum, FormatCurrencyPipe, OrdinalDatePipe, PaginationOptions, referralSortByEnum, sortOrderEnum, Status } from '@org.quicko.cliq/ngx-core';
import { MatButtonModule } from '@angular/material/button';
import { ProgramStore } from '../../../../../store/program.store';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { SkeletonLoadTableComponent } from '../../../../common/skeleton-load-table/skeleton-load-table.component';
import { TableRowStyling } from '../../../../../interfaces';
import { LabelChipComponent } from "../../../../common/label-chip/label-chip.component";
import { PromoterStore } from '../../../../../store/promoter.store';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CommissionRow } from '@org-quicko/cliq-sheet-core/Promoter/beans';

@Component({
	selector: 'app-referral-commissions',
	imports: [
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    MatChipsModule,
    MatRippleModule,
    MatPaginatorModule,
    OrdinalDatePipe,
    FormatCurrencyPipe,
    SkeletonLoadTableComponent,
    LabelChipComponent,
	NgxSkeletonLoaderModule
],
	providers: [ReferralCommissionsStore],
	templateUrl: './referral-commissions.component.html',
	styleUrl: './referral-commissions.component.scss'
})
export class ReferralCommissionsComponent implements OnInit {
	@ViewChild(MatSort) sort: MatSort;
	@ViewChild(MatPaginator) paginator: MatPaginator;

	displayedColumns: string[] = ['updated at', 'type', 'commission', 'revenue'];

	dataSource: MatTableDataSource<CommissionRow> = new MatTableDataSource<CommissionRow>([]);

	readonly programStore = inject(ProgramStore);
	readonly promoterStore = inject(PromoterStore);

	readonly programId = computed(() => this.programStore.program()!.programId);
	readonly promoterId = computed(() => this.promoterStore.promoter()!.promoterId);

	readonly referralCommissionsStore = inject(ReferralCommissionsStore);

	readonly contact = computed(() => this.referralCommissionsStore.contact());
	readonly currency = computed(() => this.programStore.program()?.currency);
	readonly isLoading = computed(() => this.referralCommissionsStore.status() === Status.LOADING);

	sortOptions = signal<{ active: 'updated at', direction: 'asc' | 'desc' }>({
		active: 'updated at',
		direction: 'desc',
	});

	paginationOptions = signal<PaginationOptions>({
		pageIndex: 0,
		pageSize: 5,
	});

	readonly totalDataLength = computed(() => {
		const metadata = this.referralCommissionsStore.commissions()?.getMetadata();
		const count = metadata ? metadata.get('count') : null;
		return count ? Number(count) : 0; // Returns 0 if count is undefined
	});

	updatedAtCellLength = 'w-[25%]';
	typeCellLength = 'w-[25%]';
	commissionCellLength = 'w-[25%]';
	revenueCellLength = 'w-[25%]';

	headersStyling: TableRowStyling[] = [
		{
			parentTheme: `${this.updatedAtCellLength} flex justify-start`,
			theme: { width: '90px' }
		},
		{
			parentTheme: `${this.typeCellLength} flex justify-center`,
			theme: { width: '90px' }
		},
		{
			parentTheme: `${this.commissionCellLength} flex justify-center`,
			theme: { width: '70px' }
		},
		{
			parentTheme: `${this.revenueCellLength} flex justify-center`,
			theme: { width: '70px' }
		},
	];

	rowsStyling: TableRowStyling[] = [
		{
			parentTheme: `${this.updatedAtCellLength} flex justify-start`,
			theme: { width: '200px' }
		},
		{
			parentTheme: `${this.typeCellLength} flex justify-center`,
			theme: { width: '64px', height: '30px' }
		},
		{
			parentTheme: `${this.commissionCellLength} flex justify-center`,
			theme: { width: '100px' }
		},
		{
			parentTheme: `${this.revenueCellLength} flex justify-center`,
			theme: { width: '100px' }
		},
	];

	constructor(private router: Router, private route: ActivatedRoute) {
		effect(() => {
			const referralCommissions = (this.referralCommissionsStore.commissions()?.getRows() ?? []) as CommissionRow[];

			const { pageIndex, pageSize } = this.paginationOptions();

			const start = pageIndex * pageSize;
			const end = Math.min(start + pageSize, referralCommissions.length);

			this.dataSource.data = referralCommissions.slice(start, end);
		});
	}

	ngOnInit(): void {
		this.referralCommissionsStore.resetLoadedPages();
		const contactId = this.route.snapshot.paramMap.get('contact_id');

		if (contactId) {
			this.loadReferralCommissions(false);
			this.referralCommissionsStore.getReferral({
				contactId,
				programId: this.programId(),
				promoterId: this.promoterId()
			});
		} else {
			console.error('No contact_id found in route.');
		}
	}

	loadReferralCommissions(isSorting: boolean = false) {
		const { pageIndex, pageSize } = this.paginationOptions();
		const skip = pageIndex * pageSize;

		const contactId = this.route.snapshot.paramMap.get('contact_id');
		if (contactId) {
			this.referralCommissionsStore.getReferralCommissions({
				contactId,
				sortBy: commissionSortByEnum.UPDATED_AT,
				sortOrder: this.sortOptions().direction === 'asc' ? sortOrderEnum.ASCENDING : sortOrderEnum.DESCENDING,
				skip,
				take: pageSize,
				isSorting,

				programId: this.programId(),
				promoterId: this.promoterId()

			});
		} else {
			console.error('No contact_id found in route.');
		}
	}

	onSortChange(event: Sort) {
		this.paginationOptions.set({ pageSize: 5, pageIndex: 0 });
		this.referralCommissionsStore.resetLoadedPages();
		this.sortOptions.set({ active: event.active as 'updated at', direction: event.direction as 'asc' | 'desc' });

		this.loadReferralCommissions(true);
	}

	onPageChange(event: PageEvent) {
		this.paginationOptions.set({ pageIndex: event.pageIndex, pageSize: event.pageSize });
		this.loadReferralCommissions();
	}


	onGoBack() {
		this.router.navigate([`../../../`], { relativeTo: this.route });
	}

	convertToCommissionRow(row: any[]) {
		return new CommissionRow(row);
	}

}
