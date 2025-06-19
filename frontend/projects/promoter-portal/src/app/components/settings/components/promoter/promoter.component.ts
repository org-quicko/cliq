import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { PromoterStore } from '../../../../store/promoter.store';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MemberStore } from '../../../../store/member.store';
import { AuthService } from '../../../../services/auth.service';
import { ProgramStore } from '../../../../store/program.store';
import { MatCardModule } from '@angular/material/card';
import { ActionableListItemComponent } from './components/actionable-list-item/actionable-list-item.component';
import { CommonModule } from '@angular/common';
import { PureAbility } from '@casl/ability';
import { AbilityServiceSignal } from '@casl/angular';
import { MemberAbility, MemberAbilityTuple } from '../../../../permissions/ability';
import { PromoterDto } from '@org.quicko.cliq/ngx-core';
import { InfoDialogBoxComponent } from '../../../common/info-dialog-box/info-dialog-box.component';
import { EditPromoterDialogBoxComponent } from './components/edit-promoter-dialog-box/edit-promoter-dialog-box.component';
import { ActionableListItemInterface } from '../../../../interfaces/actionableListItem.interface';


@Component({
	selector: 'app-promoter',
	imports: [
		MatButtonModule,
		MatDividerModule,
		MatIconModule,
		MatRippleModule,
		MatDialogModule,
		MatCardModule,
		CommonModule,
		ActionableListItemComponent,
		EditPromoterDialogBoxComponent,
		InfoDialogBoxComponent,
	],
	templateUrl: './promoter.component.html',
	styleUrl: './promoter.component.css'
})
export class PromoterComponent {
	readonly dialog = inject(MatDialog);

	readonly memberStore = inject(MemberStore);
	readonly programStore = inject(ProgramStore);
	readonly promoterStore = inject(PromoterStore);

	readonly promoter = computed(() => this.promoterStore.promoter());
	readonly programId = computed(() => this.programStore.program()!.programId);
	readonly promoterId = computed(() => this.promoterStore.promoter()!.promoterId);

	private readonly abilityService = inject<AbilityServiceSignal<MemberAbility>>(AbilityServiceSignal);
	protected readonly can = this.abilityService.can;
	private readonly ability = inject<PureAbility<MemberAbilityTuple>>(PureAbility);

	actionableItem: ActionableListItemInterface = {
		title: 'Delete promoter',
		description: 'Remove all associated links, referrals and commission data',
		icon: 'delete',
		onClick: () => {
			this.onDeletePromoter();
		}
	}

	constructor(private authService: AuthService) { }

	onEdit() {
		if (this.can('update', PromoterDto)) {
			this.dialog.open(EditPromoterDialogBoxComponent);
		} else {
			const rule = this.ability.relevantRuleFor('update', PromoterDto)!;
			this.openNotAllowedDialogBox(rule.reason!);
		}
	}

	onLeavePromoter() {
		const dialogRef = this.dialog.open(InfoDialogBoxComponent, {
			data: {
				message: `Are you sure you want to leave promoter “${this.promoter()?.name}”? You will lose all the associated data.`,
				confirmButtonText: 'Leave',
				cancelButtonText: 'Cancel',
				title: 'Leave Promoter',
				onSubmit: () => {
					this.memberStore.leavePromoter({ programId: this.programId() });
					this.logout();
				},
			}
		});
	}

	onDeletePromoter() {
		if (this.can('delete', PromoterDto)) {
			this.openDeletePromoterDialog();
		} else {
			const rule = this.ability.relevantRuleFor('delete', PromoterDto)!;
			this.openNotAllowedDialogBox(rule.reason!);
		}
	}

	openDeletePromoterDialog() {
		const dialogRef = this.dialog.open(InfoDialogBoxComponent, {
			data: {
				message: `Are you sure you want to delete promoter “${this.promoter()?.name}”? You will lose all the associated members, referrals and commission data.`,
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
				title: 'Delete Promoter',
				onSubmit: () => {
					this.promoterStore.deletePromoter({
						programId: this.programId(),
						promoterId: this.promoterId()
					});
					this.logout();
				}
			}
		});
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

	logout() {
		this.authService.deleteToken();
		window.location.href = [window.location.origin, this.programId(), 'login'].join('/');
	}
}
