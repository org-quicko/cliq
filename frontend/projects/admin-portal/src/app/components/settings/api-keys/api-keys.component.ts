import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { MatDialog } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { ApiKeyDto, OrdinalDatePipe, SnackbarService, Status, NotAllowedDialogBoxComponent } from '@org.quicko.cliq/ngx-core';
import { ApiKeysStore } from './../store/api-keys.store';
import { ProgramStore } from '../../../store/program.store';
import { InfoDialogBoxComponent } from '../../common/info-dialog-box/info-dialog-box.component';
import { ApiCredentialsDialogComponent } from './api-credentials-dialog/api-credentials-dialog.component';
import { AbilityServiceSignal } from '@casl/angular';
import { UserAbility } from '../../../permissions/ability';

@Component({
	selector: 'app-api-keys',
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatDividerModule,
		MatCardModule,
		MatIconModule,
		MatTooltipModule,
		NgxSkeletonLoaderModule,
		OrdinalDatePipe,
	],
	templateUrl: './api-keys.component.html',
})
export class ApiKeysComponent implements OnInit {

	private readonly apiKeysStore = inject(ApiKeysStore);
	private readonly programStore = inject(ProgramStore);
	private readonly dialog = inject(MatDialog);
	private readonly snackbarService = inject(SnackbarService);
	private readonly clipboard = inject(Clipboard);
	private readonly abilityService = inject<AbilityServiceSignal<UserAbility>>(AbilityServiceSignal);
	protected readonly can = this.abilityService.can;

	readonly apiKey = computed(() => this.apiKeysStore.apiKey());
	readonly isLoading = computed(() => this.apiKeysStore.status() === Status.LOADING);
	readonly programId = computed(() => this.programStore.program()?.programId);

	constructor() {
		effect(() => {
			const apiKey = this.apiKeysStore.apiKey();
			if (apiKey?.secret) {
				const ref = this.dialog.open(ApiCredentialsDialogComponent, {
					width: '516px',
					disableClose: true,
					data: { apiKey },
				});
				ref.afterClosed().subscribe(() => {
					this.apiKeysStore.clearSecret();
				});
			}
		});
	}

	ngOnInit(): void {
		const programId = this.programId()!;

			this.apiKeysStore.fetchApiKey({ programId });
	}

	onGenerateApiKey(): void {
		if (!this.can('manage', ApiKeyDto)) {
			this.dialog.open(NotAllowedDialogBoxComponent, {
				data: { description: 'You do not have permission to Generate an API key.' }
			});
			return;
		}
		const programId = this.programId()!;

		this.apiKeysStore.generateApiKey({ programId });
	}

	onRegenerateApiKey(): void {
		if (!this.can('manage', ApiKeyDto)) {
			this.dialog.open(NotAllowedDialogBoxComponent, {
				data: { description: 'You do not have permission to Generate an API key.' }
			});
			return;
		}
		const programId = this.programId()!;
	
		this.dialog.open(InfoDialogBoxComponent, {
			width: '448px',
			data: {
				title: 'Regenerate API Key?',
				message: 'Are you sure you want to regenerate the API Key? Your current API key will be disabled.',
				confirmButtonText: 'Regenerate',
				cancelButtonText: 'Cancel',
				onSubmit: () => {
					this.apiKeysStore.generateApiKey({ programId });
				}
			}
		});
	}

	copyToClipboard(text: string): void {
		const success = this.clipboard.copy(text);
		if (success) {
			this.snackbarService.openSnackBar('Copied to clipboard', undefined);
		} else {
			this.snackbarService.openSnackBar('Failed to copy', undefined);
		}
	}
}
