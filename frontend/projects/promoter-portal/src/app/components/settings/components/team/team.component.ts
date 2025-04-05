import { AfterViewInit, Component, computed, effect, inject, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TeamStore } from './store/team.store';
import { memberRoleEnum, memberSortByEnum, OrdinalDatePipe, sortOrderEnum, Status, UpdatePromoterMemberDto } from '@org.quicko.cliq/ngx-core';
import { MemberRow } from '@org.quicko.cliq/ngx-core/generated/sources/Promoter';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { AddMemberDialogBoxComponent } from './components/add-member-dialog-box/add-member-dialog-box.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MemberStore } from '../../../../store/member.store';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { MatDividerModule } from '@angular/material/divider';

@Component({
	selector: 'app-team',
	imports: [
		MatButtonModule,
		MatIconModule,
		MatTableModule,
		MatMenuModule,
		MatChipsModule,
		MatSortModule,
		MatDialogModule,
		MatDividerModule,
		MatPaginatorModule,
		TitleCasePipe,
		OrdinalDatePipe,
		CommonModule,
		NgxSkeletonLoaderModule,
		AddMemberDialogBoxComponent,
	],
	providers: [TeamStore],
	templateUrl: './team.component.html',
	styleUrl: './team.component.scss'
})
export class TeamComponent implements OnInit, AfterViewInit {
	displayedColumns: string[] = ['name', 'email', 'role', 'added on', 'menu'];

	readonly teamStore = inject(TeamStore);

	readonly memberStore = inject(MemberStore);

	readonly member = computed(() => this.memberStore.member());

	readonly isLoading = computed(() => this.teamStore.status() === Status.LOADING);

	@ViewChild(MatSort) sort: MatSort;

	@ViewChild(MatPaginator) paginator: MatPaginator;

	dataSource: MatTableDataSource<MemberRow> = new MatTableDataSource<MemberRow>([]);

	readonly dialog = inject(MatDialog);

	readonly adminRole = memberRoleEnum.ADMIN;

	sortBy: memberSortByEnum = memberSortByEnum.NAME;

	sortOrder: sortOrderEnum = sortOrderEnum.ASCENDING;

	pageIndex = 0;

	pageSize = 5;

	totalDataLength = computed(() => {
		const metadata = this.teamStore.members()?.getMetadata();
		const count = metadata ? metadata.get('count') : null;
		return count ? Number(count) : 0; // Returns 0 if count is undefined
	});

	constructor() {
		effect(() => {
			const memberRows = (this.teamStore.members()?.getRows() ?? []) as MemberRow[];
			this.dataSource.data = memberRows;
		});
	}

	ngOnInit(): void {
		this.teamStore.getAllMembers({
			sortBy: memberSortByEnum.NAME,
			sortOrder: sortOrderEnum.ASCENDING
		});
	}

	loadMembers() {
		this.teamStore.getAllMembers({
			sortBy: this.sortBy,
			sortOrder: this.sortOrder,
			skip: this.pageIndex * this.pageSize,
			take: this.pageSize,
		});
	}


	ngAfterViewInit(): void {
		this.dataSource.sort = this.sort;
		this.dataSource.paginator = this.paginator;

		this.sort.sortChange.subscribe(() => {
			this.pageIndex = 0;
			this.sortOrder = this.sort.direction === 'asc' ? sortOrderEnum.ASCENDING : sortOrderEnum.DESCENDING;
			this.loadMembers();
		});
	}


	onPageChange(event: PageEvent) {
		this.pageIndex = event.pageIndex;
		this.pageSize = event.pageSize;
		this.loadMembers();
	}


	onChangeRole(row: any) {
		const member = this.convertToMemberRow(row);
		const updatedInfo = new UpdatePromoterMemberDto();
		updatedInfo.role = memberRoleEnum.ADMIN;

		this.teamStore.updateMemberRole({ memberId: member.getMemberId(), updatedInfo });
	}

	onRemove(row: any) {
		const member = this.convertToMemberRow(row);
		this.teamStore.removeMember({ memberId: member.getMemberId() });
	}

	onAddMember() {
		console.log(this.teamStore.members()?.getRows());

		this.teamStore.setStatus(Status.PENDING);

		this.dialog.open(AddMemberDialogBoxComponent, {
			data: {
				addMember: this.teamStore.addMember,
				status: this.teamStore.status,
				setSuccessStatus: () => {
					this.teamStore.setStatus(Status.SUCCESS);
				}
			}
		});
	}

	onRemoveMember(row: any[]) {
		const member = this.convertToMemberRow(row);
		this.teamStore.removeMember({ memberId: member.getMemberId() });
	}

	convertToMemberRow(row: any[]) {
		return new MemberRow(row);
	}
}
