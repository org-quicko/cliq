import { Component, computed, inject } from '@angular/core';
import { PromoterService } from '../../../../services/promoter.service';
import { ReportsStore } from './store/reports.store';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TitleCasePipe } from '@angular/common';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReportDialogBoxComponent } from './report-dialog-box/report-dialog-box.component';
import { reportEnum, reportPeriodEnum } from '@org.quicko.cliq/ngx-core';
import { ProgramStore } from '../../../../store/program.store';
import { PromoterStore } from '../../../../store/promoter.store';

@Component({
	selector: 'app-reports',
	imports: [MatCardModule, MatIconModule, TitleCasePipe, MatRippleModule, MatDialogModule],
	providers: [ReportsStore],
	templateUrl: './reports.component.html',
	styleUrl: './reports.component.css'
})
export class ReportsComponent {

	readonly promoterService = inject(PromoterService);

	readonly programStore = inject(ProgramStore);
	readonly promoterStore = inject(PromoterStore);

	readonly programId = computed(() => this.programStore.program()!.programId);
	readonly promoterId = computed(() => this.promoterStore.promoter()!.promoterId);


	readonly reportsStore = inject(ReportsStore);

	readonly dialog = inject(MatDialog);

	reportsMap = new Map<reportEnum, string>([
		[reportEnum.PURCHASES, 'local_mall'],
		[reportEnum.SIGNUPS, 'group_add'],
		[reportEnum.COMMISSIONS, 'supervised_user_circle'],
	]);

	reportsDesc = new Map<reportEnum, string>([
		[reportEnum.PURCHASES, 'Track purchases made through your links'],
		[reportEnum.SIGNUPS, 'Track signups through your links, along with the total commission earned through it'],
		[reportEnum.COMMISSIONS, `See every commission you've earned from signups or purchases along with the revenue`],
	]);

	onClickReport(reportName: reportEnum) {

		this.reportsStore.resetStatus();

		this.dialog.open(ReportDialogBoxComponent, {
			data: {
				reportName,
				getReport: this.getReport,
				status: this.reportsStore.status
			}
		});
	}


	getReport = (reportInfo: { report: reportEnum, reportPeriod: reportPeriodEnum, startDate: Date, endDate: Date }) => {
		this.reportsStore.getReport({
			...reportInfo,
			programId: this.programId(),
			promoterId: this.promoterId(),
		})
	}

}
