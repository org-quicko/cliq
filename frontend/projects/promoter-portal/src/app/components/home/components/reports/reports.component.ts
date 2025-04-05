import { Component, inject } from '@angular/core';
import { PromoterService } from '../../../../services/promoter.service';
import { ReportsStore } from './store/reports.store';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TitleCasePipe } from '@angular/common';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReportDialogBoxComponent } from './report-dialog-box/report-dialog-box.component';
import { reportEnum } from '@org.quicko.cliq/ngx-core';

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

	reportsMap = new Map<reportEnum, string>([
		[reportEnum.PURCHASES, 'local_mall'],
		[reportEnum.SIGNUPS, 'group_add'],
		[reportEnum.COMMISSIONS, 'supervised_user_circle'],
	]);

	onClickReport(reportName: reportEnum) {
		console.log('clicked!');

		this.reportsStore.resetStatus();

		this.dialog.open(ReportDialogBoxComponent, {
			data: {
				reportName,
				getReport: this.reportsStore.getReport,
				status: this.reportsStore.status
			}
		});
	}

}
