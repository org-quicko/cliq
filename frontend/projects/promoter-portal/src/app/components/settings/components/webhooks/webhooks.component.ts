import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { SnackbarService, Status, PromoterWebhookDto, NotAllowedDialogBoxComponent, PaginationOptions } from '@org.quicko.cliq/ngx-core';
import { ProgramStore } from '../../../../store/program.store';
import { PromoterStore } from '../../../../store/promoter.store';
import { PromoterWebhooksStore } from '../../store/promoter-webhooks.store';
import { WebhookDialogComponent } from './webhook-dialog/webhook-dialog.component';
import { InfoDialogBoxComponent } from '../../../common/info-dialog-box/info-dialog-box.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { AbilityServiceSignal } from '@casl/angular';
import { MemberAbility } from '../../../../permissions/ability';

@Component({
	selector: 'app-webhooks',
	imports: [
		CommonModule,
		MatButtonModule,
		MatIconModule,
		MatDialogModule,
		MatTooltipModule,
		MatChipsModule,
		MatPaginatorModule,
		NgxSkeletonLoaderModule,
	],
	templateUrl: './webhooks.component.html',
	styleUrl: './webhooks.component.css',
})
export class WebhooksComponent implements OnInit {
	private readonly webhooksStore = inject(PromoterWebhooksStore);
	private readonly programStore = inject(ProgramStore);
	private readonly promoterStore = inject(PromoterStore);
	private readonly dialog = inject(MatDialog);
	private readonly snackbarService = inject(SnackbarService);
	private readonly abilityService = inject<AbilityServiceSignal<MemberAbility>>(AbilityServiceSignal);
	protected readonly can = this.abilityService.can;

	readonly webhooks = this.webhooksStore.webhooks;
	readonly count = this.webhooksStore.count;
	readonly isLoading = computed(() => this.webhooksStore.status() === Status.LOADING);
	readonly programId = this.programStore.program()?.programId;
	readonly promoterId = this.promoterStore.promoter()?.promoterId;

	paginationOptions = signal<PaginationOptions>({ pageIndex: 0, pageSize: 10 });
	copiedWebhookId: string | null = null;

	ngOnInit(): void {
		this.fetchWebhooks();
	}

	fetchWebhooks(): void {
		const programId = this.programId!;
		const promoterId = this.promoterId!;
		const { pageIndex, pageSize } = this.paginationOptions();
		this.webhooksStore.fetchWebhooks({ programId, promoterId, skip: pageIndex * pageSize, take: pageSize });
	}

	onPageChange(event: PageEvent): void {
		this.paginationOptions.set({ pageIndex: event.pageIndex, pageSize: event.pageSize });
		this.fetchWebhooks();
	}

	onCreateWebhook() {
		if (!this.can('manage', PromoterWebhookDto)) {
			this.dialog.open(NotAllowedDialogBoxComponent, {
				data: { description: 'You do not have permission to create a webhook.' },
			});
			return;
		}
		const assignedEvents = this.webhooks().flatMap(w => w.events ?? []);
		this.dialog.open(WebhookDialogComponent, {
			width: '500px',
			autoFocus: false,
			data: {
				assignedEvents,
				onCreate: (body: { url: string; secret: string; events: string[] }) => {
					const programId = this.programId!;
					const promoterId = this.promoterId!;
					this.webhooksStore.createWebhook({ programId, promoterId, body });
				},
			},
		});
	}

	onDeleteWebhook(webhookId: string) {
		if (!this.can('manage', PromoterWebhookDto)) {
			this.dialog.open(NotAllowedDialogBoxComponent, {
				data: { description: 'You do not have permission to delete a webhook.' },
			});
			return;
		}
		this.dialog.open(InfoDialogBoxComponent, {
			width: '448px',
			data: {
				title: 'Delete Webhook?',
				message: 'Are you sure you want to delete this webhook endpoint? This action cannot be undone.',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
				onSubmit: () => {
					const programId = this.programId!;
					const promoterId = this.promoterId!;
					this.webhooksStore.deleteWebhook({ programId, promoterId, webhookId });
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
