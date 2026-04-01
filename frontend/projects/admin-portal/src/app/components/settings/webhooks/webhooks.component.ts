import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { SnackbarService, Status } from '@org.quicko.cliq/ngx-core';
import { ProgramStore } from '../../../store/program.store';
import { WebhooksStore, onCreateWebhookSuccess, onDeleteWebhookSuccess } from '../store/webhooks.store';
import { WebhookDialogComponent } from './webhook-dialog/webhook-dialog.component';
import { InfoDialogBoxComponent } from '../../common/info-dialog-box/info-dialog-box.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
	selector: 'app-webhooks',
	imports: [
		CommonModule,
		MatButtonModule,
		MatIconModule,
		MatDialogModule,
		MatTooltipModule,
		MatChipsModule,
		NgxSkeletonLoaderModule,
	],
	providers: [WebhooksStore],
	templateUrl: './webhooks.component.html',
	styleUrl: './webhooks.component.css',
})
export class WebhooksComponent implements OnInit {
	private readonly webhooksStore = inject(WebhooksStore);
	private readonly programStore = inject(ProgramStore);
	private readonly dialog = inject(MatDialog);
	private readonly snackbarService = inject(SnackbarService);

	readonly webhooks = computed(() => this.webhooksStore.webhooks());
	readonly isLoading = computed(() => this.webhooksStore.status() === Status.LOADING);
	readonly programId = computed(() => this.programStore.program()?.programId);

	copiedWebhookId: string | null = null;

	constructor() {
		onCreateWebhookSuccess.subscribe(() => {
			this.loadWebhooks();
		});
		onDeleteWebhookSuccess.subscribe(() => {
			this.loadWebhooks();
		});
	}

	ngOnInit(): void {
		this.loadWebhooks();
	}

	loadWebhooks() {
		const programId = this.programId()!;
		this.webhooksStore.fetchWebhooks({ programId });
	}

	onCreateWebhook() {
		const assignedEvents = this.webhooks().flatMap(w => w.events ?? []);
		this.dialog.open(WebhookDialogComponent, {
			width: '500px',
			autoFocus: false,
			data: {
				assignedEvents,
				onCreate: (body: { url: string; secret: string; events: string[] }) => {
					const programId = this.programId()!;
					this.webhooksStore.createWebhook({ programId, body });
				},
			},
		});
	}

	onDeleteWebhook(webhookId: string) {
		this.dialog.open(InfoDialogBoxComponent, {
			width: '448px',
			data: {
				title: 'Delete Webhook?',
				message: 'Are you sure you want to delete this webhook endpoint? This action cannot be undone.',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
				onSubmit: () => {
					const programId = this.programId()!;
					this.webhooksStore.deleteWebhook({ programId, webhookId });
				},
			},
		});
	}

	copyWebhookUrl(webhookId: string, url: string) {
		navigator.clipboard.writeText(url).then(() => {
			this.copiedWebhookId = webhookId;
			setTimeout(() => {
				this.copiedWebhookId = null;
			}, 3000);
		});
		this.snackbarService.openSnackBar('Copied to clipboard', undefined);
	}
}
