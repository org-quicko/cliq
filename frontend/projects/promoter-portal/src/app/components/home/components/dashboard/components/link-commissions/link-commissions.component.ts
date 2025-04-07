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
import { CommissionRow } from '@org.quicko.cliq/ngx-core/generated/sources/Promoter';
import { FormatCurrencyPipe, memberSortByEnum, OrdinalDatePipe, PaginationOptions, Status, ZeroToDashPipe } from '@org.quicko.cliq/ngx-core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MemberSortOptions } from '../../../../../../interfaces';
import { SkeletonLoadTableComponent } from '../../../../../common/skeleton-load-table/skeleton-load-table.component';

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
		MatChipsModule,
		MatRippleModule,
		NgClass,
		TitleCasePipe,
		OrdinalDatePipe,
		FormatCurrencyPipe,
		SkeletonLoadTableComponent
	],
	providers: [LinkCommissionsStore],
	templateUrl: './link-commissions.component.html',
	styleUrl: './link-commissions.component.scss'
})
export class LinkCommissionsComponent implements OnInit {

	@ViewChild(MatSort) sort: MatSort;
	@ViewChild(MatPaginator) paginator: MatPaginator;

	displayedColumns: string[] = ['created at', 'referral', 'type', 'commission', 'revenue'];

	dataSource: MatTableDataSource<CommissionRow> = new MatTableDataSource<CommissionRow>([]);

	sortOptions = signal<{ active: string, direction: 'asc' | 'desc' }>({
		active: 'created at',
		direction: 'desc',
	});

	paginationOptions = signal<PaginationOptions>({
		pageIndex: 0,
		pageSize: 5,
	});

	readonly programStore = inject(ProgramStore);
	readonly linkCommissionsStore = inject(LinkCommissionsStore);

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

	constructor(private router: Router, private route: ActivatedRoute) {
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
			this.linkCommissionsStore.getLink({ linkId });
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
				linkId,
				skip,
				take: pageSize,
				isSorting
			});
		} else {
			console.error('No link_id found in route.');
		}
	}

	onSortChange(event: Sort) {
		this.paginationOptions.set({ pageSize: 5, pageIndex: 0 });
		this.linkCommissionsStore.resetLoadedPages();
		this.sortOptions.set({ active: event.active, direction: event.direction as 'asc' | 'desc' });

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
