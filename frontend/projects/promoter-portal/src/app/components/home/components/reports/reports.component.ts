import { Component, inject } from '@angular/core';
import { PromoterService } from '../../../../services/promoter.service';
import { ReportsStore } from './store/reports.store';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TitleCasePipe } from '@angular/common';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReportDialogBoxComponent } from './report-dialog-box/report-dialog-box.component';

@Component({
	selector: 'app-reports',
	imports: [MatCardModule, MatIconModule, TitleCasePipe, MatRippleModule, MatDialogModule],
	providers: [ReportsStore],
	templateUrl: './reports.component.html',
	styleUrl: './reports.component.scss'
})
export class ReportsComponent {

	readonly promoterService = inject(PromoterService);

	readonly reportsStore = inject(ReportsStore);

	readonly dialog = inject(MatDialog);

	reports = [
		['purchases', 'local_mall'],
		['signups', 'group_add'],
		['commissions', 'supervised_user_circle'],
	];

	onClickReport(reportName: string) {
		this.dialog.open(ReportDialogBoxComponent, { data: { reportName } });
	}

	onDownloadCommissionsReport() {
		this.reportsStore.getReport();
	}

}
