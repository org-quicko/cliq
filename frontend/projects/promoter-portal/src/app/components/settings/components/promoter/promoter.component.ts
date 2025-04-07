import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { PromoterStore } from '../../../../store/promoter.store';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { EditPromoterDialogBoxComponent } from './edit-promoter-dialog-box/edit-promoter-dialog-box.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogBoxComponent } from './confirm-dialog-box/confirm-dialog-box.component';
import { MemberStore } from '../../../../store/member.store';
import { AuthService } from '../../../../services/auth.service';
import { environment } from '../../../../../../environments/environment.dev';
import { ProgramStore } from '../../../../store/program.store';
import { MatCardModule } from '@angular/material/card';
import { ActionableListItemComponent } from './actionable-list-item/actionable-list-item.component';
import { CommonModule } from '@angular/common';

export interface ActionableListItemInterface {
	title: string;
	description: string;
	icon: string;
	onClick: Function;
}

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
		ConfirmDialogBoxComponent,
	],
	templateUrl: './promoter.component.html',
	styleUrl: './promoter.component.scss'
})
export class PromoterComponent {

	readonly promoterStore = inject(PromoterStore);

	readonly memberStore = inject(MemberStore);

	readonly programStore = inject(ProgramStore);

	readonly promoter = computed(() => this.promoterStore.promoter());

	readonly dialog = inject(MatDialog);

	readonly programId = computed(() => this.programStore.program()?.programId);

	actionableItems: ActionableListItemInterface[] = [
		{
			title: 'Leave promoter',
			description: 'Remove all your associated data',
			icon: 'logout',
			onClick: () => {
				this.onLeavePromoter();
			}
		},
		{
			title: 'Delete promoter',
			description: 'Remove all associated members, referrals and commission data',
			icon: 'delete',
			onClick: () => {
				this.onDeletePromoter();
			}
		},
	]

	constructor(private authService: AuthService) { }

	onEdit() {
		this.dialog.open(EditPromoterDialogBoxComponent);
	}

	onLeavePromoter() {
		const dialogRef = this.dialog.open(ConfirmDialogBoxComponent, {
			data: {
				message: `Are you sure you want to leave promoter “${this.promoter()?.name}”? You will lose all the associated data.`,
				confirmButtonText: 'Leave',
				cancelButtonText: 'Cancel',
				title: 'Leave Promoter',
				onSubmit: () => {
					this.memberStore.leavePromoter();
					this.logout();
				},
			}
		});

		dialogRef.afterClosed().subscribe((confirmed) => {
			if (confirmed) {
				console.log('User confirmed leaving the promoter');
				// Call the leave promoter logic here
			}
		});

	}

	onDeletePromoter() {
		const dialogRef = this.dialog.open(ConfirmDialogBoxComponent, {
			data: {
				message: `Are you sure you want to delete promoter “${this.promoter()?.name}”? You will lose all the associated members, referrals and commission data.`,
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
				title: 'Delete Promoter',
				onSubmit: () => {
					this.promoterStore.deletePromoter();
					this.logout();
				}
			}
		});

		dialogRef.afterClosed().subscribe((confirmed) => {
			if (confirmed) {
				console.log('User confirmed deleting the promoter');
				// Call the leave promoter logic here
			}
		});
	}

	logout() {
		this.authService.deleteToken();
		window.location.href = [environment.dashboard_host, this.programId(), 'login'].join('/');
	}
}
