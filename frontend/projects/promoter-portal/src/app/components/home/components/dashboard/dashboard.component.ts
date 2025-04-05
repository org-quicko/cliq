import { Component, inject, OnInit, effect, computed, ViewChild } from '@angular/core';
import { LinkStore } from './store/link.store';
import { CurrencyPipe, NgClass, TitleCasePipe } from '@angular/common';
import { PromoterStatsStore } from './store/promoter-stats.store';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MemberStore } from '../../../../store/member.store';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ProgramStore } from '../../../../store/program.store';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { LinkStatsRow, PromoterStatsRow } from '@org.quicko.cliq/ngx-core/generated/sources/Promoter';
import { FormatCurrencyPipe, OrdinalDatePipe, Status, ZeroToDashPipe } from '@org.quicko.cliq/ngx-core';
import { CreateLinkDialogBoxComponent } from './components/create-link-dialog-box/create-link-dialog-box.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
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
		OrdinalDatePipe,
		TitleCasePipe,
		ZeroToDashPipe,
		FormatCurrencyPipe,
		NgClass
	],
	providers: [LinkStore, PromoterStatsStore],
	styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

	readonly linkStore = inject(LinkStore);

	readonly promoterStatsStore = inject(PromoterStatsStore);

	readonly programStore = inject(ProgramStore);

	readonly memberStore = inject(MemberStore);

	readonly dialog = inject(MatDialog);

	readonly isLoading = computed(() => this.linkStore.status() === Status.LOADING);

	@ViewChild(MatPaginator) paginator: MatPaginator;

	dataSource: MatTableDataSource<LinkStatsRow> = new MatTableDataSource<LinkStatsRow>([]);

	statistics = computed(() => this.promoterStatsStore.statistics()?.getRow(0));

	program = computed(() => this.programStore.program());

	readonly linkStatsLength = computed(() => {
		const links = this.linkStore.links();
		return links ? links.length() : 0;
	});

	displayedColumns: string[] = ['link', 'commission', 'signups', 'purchases', 'created on', 'menu'];

	constructor(private router: Router, private route: ActivatedRoute) {
		effect(() => {
			const linkRows = (this.linkStore.links()?.getRows() ?? []) as LinkStatsRow[];
			this.dataSource.data = linkRows;
		});
	}

	ngOnInit() {
		this.linkStore.getPromoterLinks(); // Ensure async operation completes
		this.promoterStatsStore.getPromoterStats();
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

	onClickCreateLinkBtn() {
		this.dialog.open(CreateLinkDialogBoxComponent, {
			data: {
				createLink: this.linkStore.createLink
			}
		});
	}

	onDeleteLink(row: any[]) {
		const link = this.convertToLinkStatsRow(row);
		this.linkStore.deleteLink({ linkId: link.getLinkId() });
	}

	onCopyLink(row: any[]) {
		const link = this.convertToLinkStatsRow(row);
		this.linkStore.copyLinkToClipboard(this.program()!.website, link);
	}

	selectedRow: any = null;

	setSelectedRow(row: any) {
		this.selectedRow = row;
	}

}
