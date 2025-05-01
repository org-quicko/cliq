import { MatRippleModule } from '@angular/material/core';
import { Component, inject, OnInit, effect, computed, ViewChild, signal, WritableSignal } from '@angular/core';
import { AbilityServiceSignal } from '@casl/angular';
import { PureAbility } from '@casl/ability';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { LinkAnalyticsRow, PromoterAnalyticsRow } from '@org.quicko.cliq/ngx-core/generated/sources/Promoter';
import { CreateLinkDto, FormatCurrencyPipe, LinkDto, linkSortByEnum, OrdinalDatePipe, PaginationOptions, sortOrderEnum, Status, ZeroToDashPipe } from '@org.quicko.cliq/ngx-core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { CreateLinkDialogBoxComponent } from './components/create-link-dialog-box/create-link-dialog-box.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MemberStore } from '../../../../store/member.store';
import { ProgramStore } from '../../../../store/program.store';
import { StrokedBtnComponent } from '../../../common/stroked-btn/stroked-btn.component';
import { MemberAbility, MemberAbilityTuple } from '../../../../permissions/ability';
import { TableRowStyling } from '../../../../interfaces';
import { SkeletonLoadTableComponent } from "../../../common/skeleton-load-table/skeleton-load-table.component";
import { InfoDialogBoxComponent } from '../../../common/info-dialog-box/info-dialog-box.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { PromoterStore } from '../../../../store/promoter.store';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { DashboardStore, onCreateLinkSuccess, onDeleteLinkSuccess } from './store/dashboard.store';
import { SnackbarService } from '@org.quicko/ngx-core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
	selector: 'app-dashboard',
	imports: [
		MatCardModule,
		MatDividerModule,
		MatButtonModule,
		MatIconModule,
		MatPaginatorModule,
		MatTableModule,
		MatDialogModule,
		MatMenuModule,
		MatRippleModule,
		MatSortModule,
		CreateLinkDialogBoxComponent,
		StrokedBtnComponent,
		OrdinalDatePipe,
		ZeroToDashPipe,
		FormatCurrencyPipe,
		SkeletonLoadTableComponent,
		NgxSkeletonLoaderModule,
		InfoDialogBoxComponent,
		MatTooltipModule
	],
	providers: [DashboardStore],
	templateUrl: './dashboard.component.html',
	styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

	readonly dashboardStore = inject(DashboardStore);

	readonly programStore = inject(ProgramStore);
	readonly promoterStore = inject(PromoterStore);
	readonly memberStore = inject(MemberStore);
	readonly dialog = inject(MatDialog);

	readonly isLinksLoading = computed(() => this.dashboardStore.links().status === Status.LOADING);
	readonly isStatisticsLoading = computed(() => this.dashboardStore.analytics().status === Status.LOADING);
	readonly isMemberLoading = computed(() => this.memberStore.status() === Status.LOADING);

	private readonly abilityService = inject<AbilityServiceSignal<MemberAbility>>(AbilityServiceSignal);
	protected readonly can = this.abilityService.can;
	private readonly ability = inject<PureAbility<MemberAbilityTuple>>(PureAbility);

	@ViewChild(MatSort) sort: MatSort;
	@ViewChild(MatPaginator) paginator: MatPaginator;

	dataSource: MatTableDataSource<LinkAnalyticsRow> = new MatTableDataSource<LinkAnalyticsRow>([]);

	statistics = computed(() => this.dashboardStore.analytics().analytics?.getRow(0));

	readonly program = computed(() => this.programStore.program());
	readonly promoter = computed(() => this.promoterStore.promoter());
	readonly programId = computed(() => this.programStore.program()!.programId);
	readonly promoterId = computed(() => this.promoterStore.promoter()!.promoterId);
	readonly website = computed(() => this.programStore.program()!.website);

	tooltips = new Map<string, string>([
		['commissions', 'What you earn for every successful signup or purchase'],
		['revenue', 'The total value driven through all your links'],
		['signups', 'The number of people who signed up using your links'],
		['purchases', 'The number of purchases made using your links'],
	]);

	readonly totalLinkDataLength = computed(() => {
		const metadata = this.dashboardStore.links().links?.getMetadata();
		const count = metadata ? metadata.get('count') : null;
		return count ? Number(count) : 0;
	});

	sortOptions = signal<{ active: 'created on', direction: 'asc' | 'desc' }>({
		active: 'created on',
		direction: 'desc',
	});

	paginationOptions = signal<PaginationOptions>({
		pageIndex: 0,
		pageSize: 5,
	});

	readonly linkStatsLength = computed(() => {
		const links = this.dashboardStore.links().links;
		return links ? links.length() : 0;
	});

	selectedRow = signal<any[] | null>(null);

	displayedColumns: string[] = ['link', 'commission', 'signups', 'purchases', 'created on', 'menu'];

	linkCellLength = 'w-[25%]';
	commissionCellLength = 'w-[15%]';
	signUpsCellLength = 'w-[10%]';
	purchasesCellLength = 'w-[10%]';
	createdOnCellLength = 'w-[30%]';
	menuCellLength = 'w-[5%]';

	headersStyling: TableRowStyling[] = [
		{
			parentTheme: `${this.linkCellLength} flex justify-start`,
			theme: { width: '90px' }
		},
		{
			parentTheme: `${this.commissionCellLength} flex justify-center`,
			theme: { width: '110px' }
		},
		{
			parentTheme: `${this.signUpsCellLength} flex justify-center`,
			theme: { width: '110px' }
		},
		{
			parentTheme: `${this.purchasesCellLength} flex justify-center`,
			theme: { width: '110px' }
		},
		{
			parentTheme: `${this.createdOnCellLength} flex justify-center`,
			theme: { width: '130px' }
		},
		{
			parentTheme: `${this.menuCellLength} flex justify-center`,
			theme: { width: '50px' }
		},
	];

	rowsStyling: TableRowStyling[] = [
		{
			parentTheme: `${this.linkCellLength} flex justify-start`,
			theme: { width: '300px' }
		},
		{
			parentTheme: `${this.commissionCellLength} flex justify-center`,
			theme: { width: '50px' }
		},
		{
			parentTheme: `${this.signUpsCellLength} flex justify-center`,
			theme: { width: '50px' }
		},
		{
			parentTheme: `${this.purchasesCellLength} flex justify-center`,
			theme: { width: '50px' }
		},
		{
			parentTheme: `${this.createdOnCellLength} flex justify-center`,
			theme: { width: '130px' }
		},
		{
			parentTheme: `${this.menuCellLength} flex justify-center`,
			theme: { width: '50px' }
		},
	];

	constructor(private router: Router, private route: ActivatedRoute, private snackBarService: SnackbarService) {
		effect(() => {
			const linkRows = (this.dashboardStore.links().links?.getRows() ?? []) as LinkAnalyticsRow[];

			const { pageIndex, pageSize } = this.paginationOptions();

			const start = pageIndex * pageSize;
			const end = Math.min(start + pageSize, this.totalLinkDataLength());
			const dataRows = linkRows.slice(start, end);

			this.dataSource.data = dataRows;
		});

		onCreateLinkSuccess.subscribe(() => {
			this.loadFirstPage();
		});

		onDeleteLinkSuccess.subscribe(() => {
			this.loadFirstPage();
		});
	}

	ngOnInit() {
		this.dashboardStore.resetLoadedPages();
		this.loadLinks();
		this.dashboardStore.getPromoterStats({
			programId: this.program()!.programId,
			promoterId: this.promoter()!.promoterId,
		});
	}

	loadFirstPage = () => {
		this.dashboardStore.resetLoadedPages();
		this.dashboardStore.resetLinks();

		this.paginationOptions.update((options) => ({
			...options,
			pageIndex: 0
		}));

		this.loadLinks();
	}

	loadLinks(isSorting: boolean = false) {
		const { pageIndex, pageSize } = this.paginationOptions();
		const skip = pageIndex * pageSize;

		this.dashboardStore.getPromoterLinks({
			sortBy: this.sortOptions().active === 'created on' ? linkSortByEnum.CREATED_AT : linkSortByEnum.COMMISSION,
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
		this.dashboardStore.resetLoadedPages();
		this.sortOptions.set({ active: event.active as 'created on', direction: event.direction as 'asc' | 'desc' });

		this.loadLinks(true);
	}

	onPageChange(event: PageEvent) {
		this.paginationOptions.set({ pageIndex: event.pageIndex, pageSize: event.pageSize });
		this.loadLinks();
	}


	onClickLink(row: any[]) {
		const link = this.convertToLinkStatsRow(row);
		this.router.navigate([`./links/${link.getLinkId()}/commissions`], { relativeTo: this.route });
	}

	convertToLinkStatsRow(row: any[]) {
		return new LinkAnalyticsRow(row);
	}

	convertToPromoterStatsRow(row: any[]) {
		return new PromoterAnalyticsRow(row);
	}

	onClickCreateLinkBtn = () => {
		if (this.can('create', LinkDto)) {
			this.dialog.open(CreateLinkDialogBoxComponent, {
				data: {
					createLink: this.createLink,
				}
			});
		} else {
			const rule = this.ability.relevantRuleFor('create', LinkDto)!;
			this.openNotAllowedDialogBox(rule.reason!);
		}
	}

	createLink = (link: CreateLinkDto) => {
		this.dashboardStore.createLink({
			link,
			programId: this.programId(),
			promoterId: this.promoterId()
		});
	}

	openNotAllowedDialogBox(restrictionReason: string) {
		this.dialog.open(InfoDialogBoxComponent, {
			data: {
				message: restrictionReason,
				confirmButtonText: 'Got it',
				title: 'Action not allowed',
				removeCancelBtn: true,
				onSubmit: () => { }
			}
		});
	}

	onDeleteLink(row: any[]) {
		if (this.can('delete', LinkDto)) {
			this.selectedRow.set(row);
			this.dialog.open(InfoDialogBoxComponent, {
				data: {
					message: `You won't be able to create another link with the same ref value again. This action can't be undone.`,
					confirmButtonText: 'Delete',
					title: 'Delete link',
					onSubmit: () => { this.deleteLink() }
				}
			});
		} else {
			const rule = this.ability.relevantRuleFor('delete', LinkDto)!;
			this.openNotAllowedDialogBox(rule.reason!);
		}
	}

	deleteLink() {
		const selectedRow = this.selectedRow();

		if (!selectedRow) {
			throw new Error(`Error. No row selected for deletion`);
		}

		const link = this.convertToLinkStatsRow(selectedRow);
		this.dashboardStore.deleteLink({
			linkId: link.getLinkId(),
			programId: this.programId(),
			promoterId: this.promoterId()
		});
	}

	copiedLinkId: string | null = null;

	onCopyLink(event: MouseEvent, row: any[]) {
		event.stopPropagation();
		const link = this.convertToLinkStatsRow(row);

		const fullLinkString = this.website() + '?ref=' + link.getRefVal();

		navigator.clipboard.writeText(fullLinkString).then(() => {
			this.copiedLinkId = link.getLinkId(); // or row.linkId, anything unique
			setTimeout(() => {
				this.copiedLinkId = null;
			}, 3000);
		});

		this.snackBarService.openSnackBar('Link Copied!', '');
	}

}
