import { Component, computed, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AbilityServiceSignal } from '@casl/angular';
import { ProgramDto, SnackbarService } from '@org.quicko.cliq/ngx-core';
import { ProgramStore } from '../../../store/program.store';
import { UserAbility } from '../../../permissions/ability';
import { EditProgramProfileDialogComponent } from './edit-program-profile-dialog/edit-program-profile-dialog.component';
import { InfoDialogBoxComponent } from '../../common/info-dialog-box/info-dialog-box.component';
import { MarkdownContentComponent, NotAllowedDialogBoxComponent } from '@org.quicko.cliq/ngx-core';

@Component({
	selector: 'app-program-profile',
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatDividerModule,
		MatDialogModule,
		TitleCasePipe,
		MarkdownContentComponent,
	],
	templateUrl: './program-profile.component.html',
	styleUrl: './program-profile.component.css',
})
export class ProgramProfileComponent {

	private readonly programStore = inject(ProgramStore);
	private readonly dialog = inject(MatDialog);
	private readonly snackbarService = inject(SnackbarService);
	private readonly router = inject(Router);
	private readonly abilityService = inject<AbilityServiceSignal<UserAbility>>(AbilityServiceSignal);
	protected readonly can = this.abilityService.can;

	readonly program = computed(() => this.programStore.program());

	readonly canDeleteProgram = computed(() => this.can('delete', ProgramDto));
	readonly canUpdateProgram = computed(() => this.can('update', ProgramDto));

	onEditDetails() {
		if (!this.can('update', ProgramDto)) {
			this.dialog.open(NotAllowedDialogBoxComponent, {
				data: { description: 'You do not have permission to edit program details.' }
			});
			return;
		}

		this.dialog.open(EditProgramProfileDialogComponent, {
			width: '516px',
			autoFocus: false,
			data: {
				program: this.program(),
			}
		});
	}

	onDeleteProgram() {
		if (!this.can('delete', ProgramDto)) {
			this.dialog.open(NotAllowedDialogBoxComponent, {
				data: { description: 'You do not have permission to delete this program.' }
			});
			return;
		}

		const program = this.program();

		this.dialog.open(InfoDialogBoxComponent, {
			width: '448px',
			autoFocus: false,
			data: {
				title: 'Delete program?',
				message: `Are you sure you want to delete program "${program?.name}"? You will lose all the associated data`,
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
				onSubmit: () => {
					this.programStore.deleteProgram({
						programId: program!.programId,
						onSuccess: () => this.router.navigate(['/programs']),
					});
				}
			}
		});
	}
}
