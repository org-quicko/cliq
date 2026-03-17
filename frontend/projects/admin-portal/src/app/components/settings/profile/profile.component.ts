import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { UserStore } from '../../../store/user.store';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EditProfileDialogBoxComponent } from './edit-profile-dialog-box/edit-profile-dialog-box';

@Component({
	selector: 'app-profile',
	imports: [
		MatDividerModule,
		MatButtonModule,
		MatDialogModule,
		EditProfileDialogBoxComponent,
	],
	templateUrl: './profile.component.html',
	styleUrl: './profile.component.css'
})
export class ProfileComponent {

	readonly userStore = inject(UserStore);

	readonly user = computed(() => this.userStore.user());

	readonly displayName = computed(() => this.user()?.firstName + ' ' + this.user()?.lastName);

	readonly dialog = inject(MatDialog);

	onClickEditDetailsBtn() {
		this.userStore.resetError();
		this.dialog.open(EditProfileDialogBoxComponent, { autoFocus: false });
	}
}
