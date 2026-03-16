import { Component, computed, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AbilityServiceSignal } from '@casl/angular';
import { firstValueFrom } from 'rxjs';

import { ProgramDto, SnackbarService } from '@org.quicko.cliq/ngx-core';
import { ProgramStore } from '../../../store/program.store';
import { ProgramService } from '../../../services/program.service';
import { UserAbility } from '../../../permissions/ability';
import { EditProgramProfileDialogComponent } from './edit-program-profile-dialog/edit-program-profile-dialog.component';
import { InfoDialogBoxComponent } from '../../common/info-dialog-box/info-dialog-box.component';
import { MarkdownContentComponent } from '@org.quicko.cliq/ngx-core';

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
	private readonly programService = inject(ProgramService);
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
			this.snackbarService.openSnackBar('You do not have permission to edit program details.', undefined);
			return;
		}

		this.dialog.open(EditProgramProfileDialogComponent, {
			width: '516px',
			data: {
				program: this.program(),
			}
		});
	}

	onDeleteProgram() {
		if (!this.can('delete', ProgramDto)) {
			this.snackbarService.openSnackBar('You do not have permission to delete this program.', undefined);
			return;
		}

		const program = this.program();

		this.dialog.open(InfoDialogBoxComponent, {
			width: '448px',
			data: {
				title: 'Delete program?',
				message: `Are you sure you want to delete program "${program?.name}"? This will remove all associated links, promoters and members.`,
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
				onSubmit: async () => {
					try {
						await firstValueFrom(this.programService.deleteProgram(program!.programId));
						this.snackbarService.openSnackBar('Program deleted successfully', undefined);
						this.router.navigate(['/programs']);
					} catch (err) {
						this.snackbarService.openSnackBar('Failed to delete program', undefined);
					}
				}
			}
		});
	}
}
