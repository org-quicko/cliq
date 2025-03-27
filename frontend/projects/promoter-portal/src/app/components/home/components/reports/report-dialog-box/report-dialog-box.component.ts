import { Component, Inject, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { reportPeriodEnum, SnakeToCapitalizedPipe } from '@org.quicko.cliq/ngx-core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { ReportsStore } from '../store/reports.store';
import * as _moment from 'moment';
import { default as _rollupMoment } from 'moment';
import { CommonModule } from '@angular/common';

const moment = _rollupMoment || _moment;

const today = new Date();
const month = today.getMonth();
const year = today.getFullYear();

export const MY_FORMATS = {
	parse: {
		dateInput: 'LL', // Standard parsing
	},
	display: {
		dateInput: 'Do MMM, YYYY', // <-- Adds ordinal suffix (1st, 2nd, 3rd...)
		monthYearLabel: 'MMM YYYY',
		dateA11yLabel: 'LL',
		monthYearA11yLabel: 'MMMM YYYY',
	},
};


@Component({
	selector: 'app-report-dialog-box',
	imports: [
		MatDialogModule,
		MatIconModule,
		FormsModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatSelectModule,
		MatDatepickerModule,
		SnakeToCapitalizedPipe,
		MatDividerModule,
		MatRippleModule,
		CommonModule
	],
	providers: [provideMomentDateAdapter(MY_FORMATS), ReportsStore],
	templateUrl: './report-dialog-box.component.html',
	styleUrl: './report-dialog-box.component.scss'
})
export class ReportDialogBoxComponent implements OnInit, OnDestroy {

	destroy$ = new Subject<boolean>();

	reportPeriod = [...(Object.values(reportPeriodEnum)), 'custom'];

	readonly reportsStore = inject(ReportsStore);

	selectedPeriod: reportPeriodEnum | 'custom';

	readonly reportForm = new FormGroup({
		start: new FormControl(moment().subtract(30, 'days'), { nonNullable: true }),
		end: new FormControl(moment(), { nonNullable: true }),
		reportPeriod: new FormControl(reportPeriodEnum.LAST_30_DAYS, { nonNullable: true }),
	});

	// errorMessage = signal('');

	ngOnInit(): void { }

	constructor(
		private dialogRef: MatDialogRef<ReportDialogBoxComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any,
	) { }

	closeDialog(): void {
		this.dialogRef.close();
	}


	ngOnDestroy(): void {
		this.destroy$.next(true);
		this.destroy$.complete();
	}

	onSubmit() {
		if (this.reportForm.valid) {
			const start = this.reportForm.controls.start.value.toDate();
			const end = this.reportForm.controls.end.value.toDate();
			const reportPeriod = this.reportForm.controls.reportPeriod.value;
			console.log('form submitted!');
		}
	}
}
