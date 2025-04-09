import { Component, computed, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TeamStore } from './store/team.store';
import { memberRoleEnum, memberSortByEnum, OrdinalDatePipe, PaginationOptions, PromoterMemberDto, sortOrderEnum, Status, UpdatePromoterMemberDto } from '@org.quicko.cliq/ngx-core';
import { MemberRow } from '@org.quicko.cliq/ngx-core/generated/sources/Promoter';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { AddMemberDialogBoxComponent } from './components/add-member-dialog-box/add-member-dialog-box.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MemberStore } from '../../../../store/member.store';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { MatDividerModule } from '@angular/material/divider';
import { StrokedBtnComponent } from '../../../common/stroked-btn/stroked-btn.component';
import { MemberSortOptions } from '../../../../interfaces';
import { SkeletonLoadTableComponent } from '../../../common/skeleton-load-table/skeleton-load-table.component';
import { PureAbility } from '@casl/ability';
import { AbilityServiceSignal } from '@casl/angular';
import { MemberAbility, MemberAbilityTuple } from '../../../../permissions/ability';
import { InfoDialogBoxComponent } from '../../../common/info-dialog-box/info-dialog-box.component';

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
		SkeletonLoadTableComponent,
		StrokedBtnComponent,
		InfoDialogBoxComponent
	],
	templateUrl: './team.component.html',
	styleUrl: './team.component.scss'
})
export class TeamComponent implements OnInit {
	displayedColumns: string[] = ['name', 'email', 'role', 'added on', 'menu'];

	readonly teamStore = inject(TeamStore);
	readonly memberStore = inject(MemberStore);

	readonly member = computed(() => this.memberStore.member());
	readonly isLoading = computed(() => this.teamStore.status() === Status.LOADING);

	@ViewChild(MatSort) sort: MatSort;
	@ViewChild(MatPaginator) paginator: MatPaginator;

	private readonly abilityService = inject<AbilityServiceSignal<MemberAbility>>(AbilityServiceSignal);
	protected readonly can = this.abilityService.can;
	private readonly ability = inject<PureAbility<MemberAbilityTuple>>(PureAbility);

	sortOptions = signal<MemberSortOptions>({
		active: memberSortByEnum.NAME,
		direction: 'asc',
	});

	paginationOptions = signal<PaginationOptions>({
		pageIndex: 0,
		pageSize: 5,
	});

	dataSource: MatTableDataSource<MemberRow> = new MatTableDataSource<MemberRow>([]);

	readonly dialog = inject(MatDialog);

	readonly adminRole = memberRoleEnum.ADMIN;

	readonly totalDataLength = computed(() => {
		const metadata = this.teamStore.members()?.getMetadata();
		const count = metadata ? metadata.get('count') : null;
		return count ? Number(count) : 0; // Returns 0 if count is undefined
	});

	constructor() {
		effect(() => {
			const memberRows = (this.teamStore.members()?.getRows() ?? []) as MemberRow[];
			const { pageIndex, pageSize } = this.paginationOptions();

			const start = pageIndex * pageSize;
			const end = Math.min(start + pageSize, memberRows.length);

			this.dataSource.data = memberRows.slice(start, end);
		});
	}

	ngOnInit(): void {
		this.teamStore.resetLoadedPages();
		this.loadMembers(false);
	}


	loadMembers(isSorting: boolean = false) {
		const { pageIndex, pageSize } = this.paginationOptions();
		const skip = pageIndex * pageSize;

		this.teamStore.getAllMembers({
			sortBy: this.sortOptions().active,
			sortOrder: this.sortOptions().direction === 'asc' ? sortOrderEnum.ASCENDING : sortOrderEnum.DESCENDING,
			skip,
			take: pageSize,
			isSorting
		});
	}

	onSortChange(event: Sort) {
		this.paginationOptions.set({ pageSize: 5, pageIndex: 0 });
		this.teamStore.resetLoadedPages();
		this.sortOptions.set({ active: event.active as memberSortByEnum, direction: event.direction as 'asc' | 'desc' });

		this.loadMembers(true);
	}


	onPageChange(event: PageEvent) {
		this.paginationOptions.set({ pageIndex: event.pageIndex, pageSize: event.pageSize });
		this.loadMembers();
	}


	onChangeRole(row: any) {
		if (this.can('change_role', PromoterMemberDto)) {
			const member = this.convertToMemberRow(row);
			const updatedInfo = new UpdatePromoterMemberDto();
			updatedInfo.role = memberRoleEnum.ADMIN;

			this.teamStore.updateMemberRole({ memberId: member.getMemberId(), updatedInfo });
		} else {
			const rule = this.ability.relevantRuleFor('change_role', PromoterMemberDto)!;
			this.openNotAllowedDialogBox(rule.reason!);
		}
	}

	onRemove(row: any) {
		const member = this.convertToMemberRow(row);
		this.teamStore.removeMember({ memberId: member.getMemberId() });
	}

	onAddMember = () => {
		if (this.can('invite_member', PromoterMemberDto)) {
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
		} else {
			const rule = this.ability.relevantRuleFor('invite_member', PromoterMemberDto)!;
			this.openNotAllowedDialogBox(rule.reason!);
		}
	}

	onRemoveMember(row: any[]) {

		if (this.can('remove_member', PromoterMemberDto)) {
			const member = this.convertToMemberRow(row);
			this.teamStore.removeMember({ memberId: member.getMemberId() });
		} else {
			const rule = this.ability.relevantRuleFor('remove_member', PromoterMemberDto)!;
			this.openNotAllowedDialogBox(rule.reason!);
		}

	}

	openNotAllowedDialogBox(restrictionReason: string) {
		this.dialog.open(InfoDialogBoxComponent, {
			data: {
				message: restrictionReason,
				confirmButtonText: 'Got it',
				title: 'Action not allowed',
				removeCancelBtn: true,
				onSubmit: () => {}
			}
		});
	}

	convertToMemberRow(row: any[]) {
		return new MemberRow(row);
	}
}
