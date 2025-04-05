import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MemberStore } from '../../../../store/member.store';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EditProfileDialogBoxComponent } from './edit-profile-dialog-box/edit-profile-dialog-box.component';

@Component({
	selector: 'app-profile',
	imports: [MatDividerModule, MatButtonModule, MatDialogModule, EditProfileDialogBoxComponent],
	templateUrl: './profile.component.html',
	styleUrl: './profile.component.scss'
})
export class ProfileComponent {

	readonly memberStore = inject(MemberStore);

	readonly member = computed(() => this.memberStore.member());

	readonly displayName = computed(() => this.member()?.firstName + ' ' + this.member()?.lastName);

	readonly dialog = inject(MatDialog);

	onClickEditDetailsBtn() {
		this.memberStore.resetError();
		this.dialog.open(EditProfileDialogBoxComponent);
	}
}
