import { Component, computed, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ReferralCommissionsStore } from './store/referralCommissions.store';
import { CommissionRow } from '@org.quicko.cliq/ngx-core/generated/sources/Promoter';
import { FormatCurrencyPipe, OrdinalDatePipe, PaginationOptions, referralSortByEnum, sortOrderEnum } from '@org.quicko.cliq/ngx-core';
import { MatButtonModule } from '@angular/material/button';
import { ProgramStore } from '../../../../../store/program.store';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { SkeletonLoadTableComponent } from '../../../../common/skeleton-load-table/skeleton-load-table.component';

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
		TitleCasePipe,
		OrdinalDatePipe,
		FormatCurrencyPipe,
		SkeletonLoadTableComponent,
	],
	providers: [ReferralCommissionsStore],
	templateUrl: './referral-commissions.component.html',
	styleUrl: './referral-commissions.component.scss'
})
export class ReferralCommissionsComponent implements OnInit {
	@ViewChild(MatSort) sort: MatSort;
	@ViewChild(MatPaginator) paginator: MatPaginator;

	displayedColumns: string[] = ['created at', 'type', 'commission', 'revenue'];

	dataSource: MatTableDataSource<CommissionRow> = new MatTableDataSource<CommissionRow>([]);

	readonly programStore = inject(ProgramStore);

	readonly referralCommissionsStore = inject(ReferralCommissionsStore);

	readonly contact = computed(() => this.referralCommissionsStore.contact());

	readonly currency = computed(() => this.programStore.program()?.currency);

	sortOptions = signal<{ active: referralSortByEnum, direction: 'asc' | 'desc' }>({
		active: referralSortByEnum.UPDATED_AT,
		direction: 'asc',
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
			this.loadReferralCommissions();
			this.referralCommissionsStore.getReferral({ contactId });
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
				sortBy: this.sortOptions().active,
				sortOrder: this.sortOptions().direction === 'asc' ? sortOrderEnum.ASCENDING : sortOrderEnum.DESCENDING,
				skip,
				take: pageSize,
				isSorting
			});
		} else {
			console.error('No contact_id found in route.');
		}
	}

	onSortChange(event: Sort) {
		this.paginationOptions.set({ pageSize: 5, pageIndex: 0 });
		this.referralCommissionsStore.resetLoadedPages();
		this.sortOptions.set({ active: event.active as referralSortByEnum, direction: event.direction as 'asc' | 'desc' });

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
