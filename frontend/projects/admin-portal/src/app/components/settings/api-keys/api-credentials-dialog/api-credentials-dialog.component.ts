import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Clipboard } from '@angular/cdk/clipboard';
import { OrdinalDatePipe, SnackbarService, ApiKeyDto } from '@org.quicko.cliq/ngx-core';

@Component({
	selector: 'app-api-credentials-dialog',
	standalone: true,
	imports: [
		CommonModule,
		MatDialogModule,
		MatButtonModule,
		MatIconModule,
		MatDividerModule,
		OrdinalDatePipe,
	],
	templateUrl: './api-credentials-dialog.component.html',
})
export class ApiCredentialsDialogComponent {

	private readonly clipboard = inject(Clipboard);
	private readonly snackbarService = inject(SnackbarService);

	constructor(
		@Inject(MAT_DIALOG_DATA) public data: { apiKey: ApiKeyDto },
		public dialogRef: MatDialogRef<ApiCredentialsDialogComponent>,
	) { }

	copyToClipboard(text: string): void {
		const success = this.clipboard.copy(text);
		if (success) {
			this.snackbarService.openSnackBar('Copied to clipboard', undefined);
		} else {
			this.snackbarService.openSnackBar('Failed to copy', undefined);
		}
	}

	downloadTxt(): void {
		const { apiKey } = this.data;
		const textContent =
			`API Key: ${apiKey.key || ''}\n` +
			`Secret: ${apiKey.secret || ''}\n` +
			`Created At: ${apiKey.createdAt || ''}\n`;

		const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'api-key.txt';
		link.click();
		URL.revokeObjectURL(url);
	}
}
