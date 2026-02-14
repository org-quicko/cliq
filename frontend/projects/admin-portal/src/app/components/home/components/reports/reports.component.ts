import { Component, computed, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReportsStore } from './store/reports.store';
import { ReportDialogBoxComponent } from './report-dialog-box/report-dialog-box.component';
import { reportEnum, reportPeriodEnum } from '@org.quicko.cliq/ngx-core';
import { ProgramStore } from '../../../../store/program.store';

export enum adminReportEnum {
    COMMISSION_REPORT = 'commission report'
}

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatRippleModule,
        MatDialogModule
    ],
    providers: [ReportsStore],
    templateUrl: './reports.component.html',
    styleUrl: './reports.component.css'
})
export class ReportsComponent {

    readonly programStore = inject(ProgramStore);
    readonly reportsStore = inject(ReportsStore);
    readonly dialog = inject(MatDialog);

    readonly programId = computed(() => this.programStore.program()!.programId);

    reportsLogoMap: [string, string][] = [
        [reportEnum.COMMISSIONS, 'flowsheet']
    ];

    reportsDesc = new Map<string, string>([
        [reportEnum.COMMISSIONS, 'View promoter commissions from signups and purchases, along with total revenue.']
    ]);

    onClickReport(reportName: string) {
        this.reportsStore.resetStatus();

        this.dialog.open(ReportDialogBoxComponent, {
            data: {
                reportName,
                getReport: this.getReport,
                status: this.reportsStore.status
            }
        });
    }

    getReport = (reportInfo: { reportPeriod: reportPeriodEnum, startDate: Date, endDate: Date }) => {
        this.reportsStore.getCommissionsReport({
            ...reportInfo,
            programId: this.programId(),
        });
    }
}