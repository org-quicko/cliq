import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MemberStore } from '../../../../store/member.store';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EditProfileDialogBoxComponent } from './edit-profile-dialog-box/edit-profile-dialog-box.component';
import { ActionableListItemComponent } from '../promoter/components/actionable-list-item/actionable-list-item.component';
import { ActionableListItemInterface } from '../../../../interfaces/actionableListItem.interface';
import { InfoDialogBoxComponent } from '../../../common/info-dialog-box/info-dialog-box.component';
import { AuthService } from '../../../../services/auth.service';
import { ProgramStore } from '../../../../store/program.store';

@Component({
	selector: 'app-profile',
	imports: [
		MatDividerModule,
		MatButtonModule,
		MatDialogModule,
		EditProfileDialogBoxComponent,
		ActionableListItemComponent,
		InfoDialogBoxComponent,
	],
	templateUrl: './profile.component.html',
	styleUrl: './profile.component.scss'
})
export class ProfileComponent {

	readonly memberStore = inject(MemberStore);
	readonly programStore = inject(ProgramStore);

	readonly member = computed(() => this.memberStore.member());
	readonly programId = computed(() => this.programStore.program()!.programId);

	readonly displayName = computed(() => this.member()?.firstName + ' ' + this.member()?.lastName);

	readonly dialog = inject(MatDialog);

	actionableItem: ActionableListItemInterface = {
		title: 'Delete account',
		description: 'Remove all your associated data',
		icon: 'delete',
		onClick: () => {
			this.onDeleteAccount();
		}
	};

	constructor(private authService: AuthService) { }

	onClickEditDetailsBtn() {
		this.memberStore.resetError();
		this.dialog.open(EditProfileDialogBoxComponent);
	}

	onDeleteAccount() {
		this.dialog.open(InfoDialogBoxComponent, {
			data: {
				message: `Are you sure you want to delete your account? You will lose all the associated members, referrals and commission data.`,
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
				title: 'Delete account',
				onSubmit: () => {
					this.memberStore.deleteAccount({ programId: this.programId() });
					this.logout();
				}
			}
		});
	}

	logout() {
		this.authService.deleteToken();
		window.location.href = [window.location.origin, this.programId(), 'login'].join('/');
	}
}
