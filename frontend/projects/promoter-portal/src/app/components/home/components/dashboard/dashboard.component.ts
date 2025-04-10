import { MatRippleModule } from '@angular/material/core';
import { Component, inject, OnInit, effect, computed, ViewChild, signal } from '@angular/core';
import { AbilityServiceSignal } from '@casl/angular';
import { PureAbility } from '@casl/ability';
import { CurrencyPipe, NgClass, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { LinkStatsRow, PromoterStatsRow } from '@org.quicko.cliq/ngx-core/generated/sources/Promoter';
import { CreateLinkDto, FormatCurrencyPipe, LinkDto, OrdinalDatePipe, PaginationOptions, Status, ZeroToDashPipe } from '@org.quicko.cliq/ngx-core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { CreateLinkDialogBoxComponent } from './components/create-link-dialog-box/create-link-dialog-box.component';
import { LinkStore } from './store/link.store';
import { ActivatedRoute, Router } from '@angular/router';
import { PromoterStatsStore } from './store/promoter-stats.store';
import { MemberStore } from '../../../../store/member.store';
import { ProgramStore } from '../../../../store/program.store';
import { StrokedBtnComponent } from '../../../common/stroked-btn/stroked-btn.component';
import { MemberAbility, MemberAbilityTuple } from '../../../../permissions/ability';
import { TableRowStyling } from '../../../../interfaces';
import { SkeletonLoadTableComponent } from "../../../common/skeleton-load-table/skeleton-load-table.component";
import { InfoDialogBoxComponent } from '../../../common/info-dialog-box/info-dialog-box.component';

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
		CreateLinkDialogBoxComponent,
		StrokedBtnComponent,
		OrdinalDatePipe,
		TitleCasePipe,
		ZeroToDashPipe,
		FormatCurrencyPipe,
		SkeletonLoadTableComponent,
		NgxSkeletonLoaderComponent,
		InfoDialogBoxComponent,
	],
	providers: [LinkStore, PromoterStatsStore],
	templateUrl: './dashboard.component.html',
	styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

	readonly linkStore = inject(LinkStore);
	readonly promoterStatsStore = inject(PromoterStatsStore);
	readonly programStore = inject(ProgramStore);
	readonly memberStore = inject(MemberStore);
	readonly dialog = inject(MatDialog);

	readonly isLinksLoading = computed(() => this.linkStore.status() === Status.LOADING);
	readonly isStatisticsLoading = computed(() => this.promoterStatsStore.status() === Status.LOADING);

	private readonly abilityService = inject<AbilityServiceSignal<MemberAbility>>(AbilityServiceSignal);
	protected readonly can = this.abilityService.can;
	private readonly ability = inject<PureAbility<MemberAbilityTuple>>(PureAbility);

	@ViewChild(MatPaginator) paginator: MatPaginator;

	dataSource: MatTableDataSource<LinkStatsRow> = new MatTableDataSource<LinkStatsRow>([]);

	statistics = computed(() => this.promoterStatsStore.statistics()?.getRow(0));
	program = computed(() => this.programStore.program());
	totalLinkDataLength = computed(() => {
		const metadata = this.linkStore.links()?.getMetadata();
		const count = metadata ? metadata.get('count') : null;
		return count ? Number(count) : 0;
	});

	paginationOptions = signal<PaginationOptions>({
		pageIndex: 0,
		pageSize: 5,
	});

	readonly linkStatsLength = computed(() => {
		const links = this.linkStore.links();
		return links ? links.length() : 0;
	});

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

	constructor(private router: Router, private route: ActivatedRoute) {
		effect(() => {
			const linkRows = (this.linkStore.links()?.getRows() ?? []) as LinkStatsRow[];

			const { pageIndex, pageSize } = this.paginationOptions();

			const start = pageIndex * pageSize;
			const end = Math.min(start + pageSize, this.totalLinkDataLength());
			const dataRows = linkRows.slice(start, end);

			this.dataSource.data = dataRows;
		});
	}

	ngOnInit() {
		this.linkStore.resetLoadedPages();
		this.loadLinks();
		this.promoterStatsStore.getPromoterStats();
	}

	loadLinks = () => {
		const { pageIndex, pageSize } = this.paginationOptions();
		const skip = pageIndex * pageSize;

		this.linkStore.getPromoterLinks({
			skip,
			take: pageSize
		});
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
		return new LinkStatsRow(row);
	}

	convertToPromoterStatsRow(row: any[]) {
		return new PromoterStatsRow(row);
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
		this.linkStore.createLink({ link });
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
			this.deleteLink(row);
		} else {
			const rule = this.ability.relevantRuleFor('delete', LinkDto)!;
			this.openNotAllowedDialogBox(rule.reason!);
		}
	}

	deleteLink(row: any[]) {
		const link = this.convertToLinkStatsRow(row);
		this.linkStore.deleteLink({ linkId: link.getLinkId() });
	}

	onCopyLink(row: any[]) {
		const link = this.convertToLinkStatsRow(row);
		this.linkStore.copyLinkToClipboard(this.program()!.website, link);
	}

}
