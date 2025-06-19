import { NgClass, TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ProgramStore } from '../../../../../../store/program.store';
import { ActivatedRoute, Router } from '@angular/router';
import { LinkCommissionsStore } from './store/linkCommission.store';
import { commissionSortByEnum, FormatCurrencyPipe, memberSortByEnum, OrdinalDatePipe, PaginationOptions, referralSortByEnum, SnackbarService, sortOrderEnum, Status, ZeroToDashPipe } from '@org.quicko.cliq/ngx-core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MemberSortOptions, TableRowStyling } from '../../../../../../interfaces';
import { SkeletonLoadTableComponent } from '../../../../../common/skeleton-load-table/skeleton-load-table.component';
import { PromoterStore } from '../../../../../../store/promoter.store';
import { LabelChipComponent } from '../../../../../common/label-chip/label-chip.component';
import { NgxSkeletonLoaderComponent, NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CommissionRow } from '@org-quicko/cliq-sheet-core/Promoter/beans';

@Component({
	selector: 'app-link-commissions',
	imports: [
		MatIconModule,
		MatInputModule,
		MatButtonModule,
		MatTableModule,
		FormsModule,
		MatFormFieldModule,
		MatPaginatorModule,
		MatSortModule,
		MatRippleModule,
		TitleCasePipe,
		OrdinalDatePipe,
		FormatCurrencyPipe,
		SkeletonLoadTableComponent,
		LabelChipComponent,
		NgxSkeletonLoaderModule,
	],
	providers: [LinkCommissionsStore],
	templateUrl: './link-commissions.component.html',
	styleUrl: './link-commissions.component.css'
})
export class LinkCommissionsComponent implements OnInit {

	@ViewChild(MatSort) sort: MatSort;
	@ViewChild(MatPaginator) paginator: MatPaginator;

	displayedColumns: string[] = ['created at', 'referral', 'type', 'commission', 'revenue'];

	dataSource: MatTableDataSource<CommissionRow> = new MatTableDataSource<CommissionRow>([]);

	sortOptions = signal<{ active: 'created at', direction: 'asc' | 'desc' }>({
		active: 'created at',
		direction: 'desc',
	});

	paginationOptions = signal<PaginationOptions>({
		pageIndex: 0,
		pageSize: 5,
	});

	readonly linkCommissionsStore = inject(LinkCommissionsStore);
	readonly programStore = inject(ProgramStore);
	readonly promoterStore = inject(PromoterStore);

	readonly programId = computed(() => this.programStore.program()!.programId);
	readonly promoterId = computed(() => this.promoterStore.promoter()!.promoterId);

	readonly link = computed(() => this.linkCommissionsStore.link());
	readonly program = computed(() => this.programStore.program());
	readonly fullLinkString = computed(() => this.program()?.website + '?ref=' + this.link()?.refVal);
	readonly referralKeyType = computed(() => this.programStore.program()?.referralKeyType);
	readonly isLoading = computed(() => this.linkCommissionsStore.status() === Status.LOADING);

	readonly totalDataLength = computed(() => {
		const metadata = this.linkCommissionsStore.commissions()?.getMetadata();
		const count = metadata ? metadata.get('count') : null;
		return count ? Number(count) : 0; // Returns 0 if count is undefined
	});

	referralKey = signal('');

	createdAtCellLength = 'w-[20%]';
	referralCellLength = 'w-[25%]';
	typeCellLength = 'w-[18%]';
	commissionCellLength = 'w-[19%]';
	revenueCellLength = 'w-[18%]';

	headersStyling: TableRowStyling[] = [
		{
			parentTheme: `${this.createdAtCellLength} flex justify-start`,
			theme: { width: '130px' }
		},
		{
			parentTheme: `${this.commissionCellLength} flex justify-center`,
			theme: { width: '150px' }
		},
		{
			parentTheme: `${this.revenueCellLength} flex justify-center`,
			theme: { width: '90px' }
		},
		{
			parentTheme: `${this.referralCellLength} flex justify-center`,
			theme: { width: '100px' }
		},
		{
			parentTheme: `${this.typeCellLength} flex justify-center`,
			theme: { width: '90px' }
		},
	];

	rowsStyling: TableRowStyling[] = [
		{
			parentTheme: `${this.createdAtCellLength} flex justify-start`,
			theme: { width: '200px' }
		},
		{
			parentTheme: `${this.commissionCellLength} flex justify-center`,
			theme: { width: '140px' }
		},
		{
			parentTheme: `${this.revenueCellLength} flex justify-center`,
			theme: { width: '100px' }
		},
		{
			parentTheme: `${this.referralCellLength} flex justify-center`,
			theme: { width: '100px' }
		},
		{
			parentTheme: `${this.typeCellLength} flex justify-center`,
			theme: { width: '100px' }
		},
	];

	constructor(private router: Router, private route: ActivatedRoute, private snackBarService: SnackbarService) {
		effect(() => {
			const linkCommissions = (this.linkCommissionsStore.commissions()?.getRows() ?? []) as CommissionRow[];
			const { pageIndex, pageSize } = this.paginationOptions();

			const start = pageIndex * pageSize;
			const end = Math.min(start + pageSize, linkCommissions.length);

			this.dataSource.data = linkCommissions.slice(start, end);
		});
	}

	ngOnInit(): void {
		this.linkCommissionsStore.resetLoadedPages();

		const linkId = this.route.snapshot.paramMap.get('link_id');
		if (linkId) {
			this.loadLinkCommissions();
			this.linkCommissionsStore.getLink({
				linkId,
				programId: this.programId(),
				promoterId: this.promoterId(),
			});
		} else {
			console.error('No link_id found in route.');
		}
	}

	loadLinkCommissions(isSorting: boolean = false) {
		const { pageIndex, pageSize } = this.paginationOptions();
		const skip = pageIndex * pageSize;

		const linkId = this.route.snapshot.paramMap.get('link_id');

		if (linkId) {
			this.linkCommissionsStore.getLinkCommissions({
				sortBy: commissionSortByEnum.CREATED_AT,
				sortOrder: this.sortOptions().direction === 'asc' ? sortOrderEnum.ASCENDING : sortOrderEnum.DESCENDING,
				linkId,
				skip,
				take: pageSize,
				isSorting,

				programId: this.programId(),
				promoterId: this.promoterId()

			});
		} else {
			console.error('No link_id found in route.');
		}
	}

	onSortChange(event: Sort) {
		this.paginationOptions.set({ pageSize: 5, pageIndex: 0 });
		this.linkCommissionsStore.resetLoadedPages();
		this.sortOptions.set({ active: event.active as 'created at', direction: event.direction as 'asc' | 'desc' });

		this.loadLinkCommissions(true);
	}

	onPageChange(event: PageEvent) {
		this.paginationOptions.set({ pageIndex: event.pageIndex, pageSize: event.pageSize });
		this.loadLinkCommissions();
	}

	onGoBack() {
		this.router.navigate([`../../../`], { relativeTo: this.route });
	}

	onSearch() {
	}

	onClear() {
		this.referralKey.set('');
	}

	convertToCommissionRow(row: any[]) {
		return new CommissionRow(row);
	}

	copiedLink: boolean = false;

	onCopyLink(event: MouseEvent) {
		event.stopPropagation();

		const fullLinkString = this.program()?.website + '?ref=' + this.link()?.refVal;

		navigator.clipboard.writeText(fullLinkString).then(() => {
			this.copiedLink = true; // or row.linkId, anything unique
			setTimeout(() => {
				this.copiedLink = false;
			}, 3000);
		});

		this.snackBarService.openSnackBar('Link Copied!', '');
	}
}
