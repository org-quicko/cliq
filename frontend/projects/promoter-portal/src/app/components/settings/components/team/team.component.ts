import { Component, computed, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { onAddMemberSuccess, onRemoveMemberSuccess, TeamStore } from './store/team.store';
import { CreateMemberDto, memberRoleEnum, memberSortByEnum, OrdinalDatePipe, PaginationOptions, PromoterMemberDto, sortOrderEnum, Status, UpdatePromoterMemberDto } from '@org.quicko.cliq/ngx-core';
import { MemberRow } from '@org-quicko/cliq-sheet-core/Promoter/beans';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { AddMemberDialogBoxComponent } from './components/add-member-dialog-box/add-member-dialog-box.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MemberStore } from '../../../../store/member.store';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { MatDividerModule } from '@angular/material/divider';
import { StrokedBtnComponent } from '../../../common/stroked-btn/stroked-btn.component';
import { MemberSortOptions, TableRowStyling } from '../../../../interfaces';
import { SkeletonLoadTableComponent } from '../../../common/skeleton-load-table/skeleton-load-table.component';
import { PureAbility } from '@casl/ability';
import { AbilityServiceSignal } from '@casl/angular';
import { MemberAbility, MemberAbilityTuple } from '../../../../permissions/ability';
import { InfoDialogBoxComponent } from '../../../common/info-dialog-box/info-dialog-box.component';
import { LabelChipComponent } from "../../../common/label-chip/label-chip.component";
import { ProgramStore } from '../../../../store/program.store';
import { PromoterStore } from '../../../../store/promoter.store';

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
		InfoDialogBoxComponent,
		LabelChipComponent
	],
	providers: [TeamStore],
	templateUrl: './team.component.html',
	styleUrl: './team.component.css'
})
export class TeamComponent implements OnInit {
	displayedColumns: string[] = ['name', 'email', 'role', 'added on', 'menu'];

	readonly teamStore = inject(TeamStore);
	readonly memberStore = inject(MemberStore);

	readonly programStore = inject(ProgramStore);
	readonly promoterStore = inject(PromoterStore);

	readonly programId = computed(() => this.programStore.program()!.programId);
	readonly promoterId = computed(() => this.promoterStore.promoter()!.promoterId);

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

	memberRoles = Object.values(memberRoleEnum);

	readonly totalDataLength = computed(() => {
		const metadata = this.teamStore.members()?.getMetadata();
		const count = metadata ? metadata.get('count') : null;
		return count ? Number(count) : 0; // Returns 0 if count is undefined
	});

	nameCellLength = 'w-[25%]';
	emailCellLength = 'w-[25%]';
	roleCellLength = 'w-[15%]';
	addedOnCellLength = 'w-[30%]';
	menuCellLength = 'w-[5%]';

	headersStyling: TableRowStyling[] = [
		{
			parentTheme: `${this.nameCellLength} min-w-[328px] flex justify-start`,
			theme: { width: '90px' }
		},
		{
			parentTheme: `${this.emailCellLength} flex justify-center`,
			theme: { width: '95px' }
		},
		{
			parentTheme: `${this.roleCellLength} flex justify-center`,
			theme: { width: '90px' }
		},
		{
			parentTheme: `${this.addedOnCellLength} flex justify-center`,
			theme: { width: '130px' }
		},
		{
			parentTheme: `${this.menuCellLength} flex justify-end`,
			theme: { width: '50px' }
		},
	];

	rowsStyling: TableRowStyling[] = [
		{
			parentTheme: `${this.nameCellLength} min-w-[328px] flex justify-start`,
			theme: { width: '200px' }
		},
		{
			parentTheme: `${this.emailCellLength} flex justify-center`,
			theme: { width: '130px' }
		},
		{
			parentTheme: `${this.roleCellLength} flex justify-center`,
			theme: { width: '100px' }
		},
		{
			parentTheme: `${this.addedOnCellLength} flex justify-center`,
			theme: { width: '200px' }
		},
		{
			parentTheme: `${this.menuCellLength} flex justify-end`,
			theme: { width: '50px' }
		},
	];

	constructor() {
		effect(() => {
			const memberRows = (this.teamStore.members()?.getRows() ?? []) as MemberRow[];
			const { pageIndex, pageSize } = this.paginationOptions();

			const start = pageIndex * pageSize;
			const end = Math.min(start + pageSize, memberRows.length);

			this.dataSource.data = memberRows.slice(start, end);
		});

		onAddMemberSuccess.subscribe(() => {
			this.loadFirstPage();
		});

		onRemoveMemberSuccess.subscribe(() => {
			this.loadFirstPage();
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
			isSorting,

			programId: this.programId(),
			promoterId: this.promoterId()
		});
	}

	onSortChange(event: Sort) {
		this.paginationOptions.set({ pageSize: 5, pageIndex: 0 });
		this.teamStore.resetLoadedPages();
		this.sortOptions.set({ active: event.active as memberSortByEnum, direction: event.direction as 'asc' | 'desc' });

		this.loadMembers(true);
	}

	loadFirstPage = () => {
		this.teamStore.resetLoadedPages();
		this.teamStore.resetMembers();

		this.paginationOptions.update((options) => ({
			...options,
			pageIndex: 0
		}));

		this.loadMembers();
	}


	onPageChange(event: PageEvent) {
		this.paginationOptions.set({ pageIndex: event.pageIndex, pageSize: event.pageSize });
		this.loadMembers();
	}


	onChangeRole(row: any[], role: memberRoleEnum) {
		if (this.can('change_role', PromoterMemberDto)) {
			const member = this.convertToMemberRow(row);
			const updatedInfo = new UpdatePromoterMemberDto();
			updatedInfo.role = role;

			this.teamStore.updateMemberRole({
				memberId: member.getMemberId(),
				updatedInfo,
				programId: this.programId(),
				promoterId: this.promoterId(),
			});
		} else {
			const rule = this.ability.relevantRuleFor('change_role', PromoterMemberDto)!;
			this.openNotAllowedDialogBox(rule.reason!);
		}
	}

	onRemove(row: any) {
		const member = this.convertToMemberRow(row);
		this.teamStore.removeMember({ memberId: member.getMemberId(), programId: this.programId(), promoterId: this.promoterId() });
	}

	onAddMember = () => {
		if (this.can('invite_member', PromoterMemberDto)) {
			this.teamStore.setStatus(Status.PENDING);

			this.dialog.open(AddMemberDialogBoxComponent, {
				data: {
					addMember: this.addMember,
					status: this.teamStore.status,
				}
			});
		} else {
			const rule = this.ability.relevantRuleFor('invite_member', PromoterMemberDto)!;
			this.openNotAllowedDialogBox(rule.reason!);
		}
	}

	addMember = (addedMember: CreateMemberDto) => {
		this.teamStore.addMember({
			addedMember,
			programId: this.programId(),
			promoterId: this.promoterId(),
		});
	}

	onRemoveMember(row: any[]) {

		if (this.can('remove_member', PromoterMemberDto)) {
			const member = this.convertToMemberRow(row);
			this.teamStore.removeMember({ memberId: member.getMemberId(), programId: this.programId(), promoterId: this.promoterId() });
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
				onSubmit: () => { }
			}
		});
	}

	convertToMemberRow(row: any[]) {
		return new MemberRow(row);
	}
}
