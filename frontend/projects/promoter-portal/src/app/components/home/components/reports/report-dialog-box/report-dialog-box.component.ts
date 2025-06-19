import { Component, effect, Inject, OnDestroy, OnInit, Signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { getStartEndDate, reportEnum, reportPeriodEnum, SnakeToCapitalizedPipe, Status } from '@org.quicko.cliq/ngx-core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import * as _moment from 'moment';
import { default as _rollupMoment } from 'moment';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FormDialogBoxComponent } from '../../../../common/form-dialog-box/form-dialog-box.component';

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
		MatButtonModule,
		MatIconModule,
		FormsModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatSelectModule,
		MatDatepickerModule,
		SnakeToCapitalizedPipe,
		MatDividerModule,
		MatRippleModule,
		CommonModule,
		FormDialogBoxComponent
	],
	providers: [provideMomentDateAdapter(MY_FORMATS)],
	templateUrl: './report-dialog-box.component.html',
	styleUrl: './report-dialog-box.component.css'
})
export class ReportDialogBoxComponent implements OnInit, OnDestroy {

	destroy$ = new Subject<boolean>();

	reportPeriod = Object.values(reportPeriodEnum);

	selectedPeriod: reportPeriodEnum;

	minDate = moment().subtract(1, 'year').startOf('day');
	maxDate = moment();

	readonly reportForm = new FormGroup({
		start: new FormControl(moment().subtract(30, 'days'), { nonNullable: true }),
		end: new FormControl(moment(), { nonNullable: true }),
		reportPeriod: new FormControl(reportPeriodEnum.LAST_30_DAYS, { nonNullable: true }),
	});

	ngOnInit(): void { }

	constructor(
		private dialogRef: MatDialogRef<ReportDialogBoxComponent>,
		@Inject(MAT_DIALOG_DATA) public data: { reportName: reportEnum, getReport: Function, status: Signal<Status> },
	) {
		this.reportForm.controls.start.disable();
		this.reportForm.controls.end.disable();

		this.reportForm.controls.reportPeriod.valueChanges.subscribe((value) => {
			if (value === reportPeriodEnum.CUSTOM) {
				this.reportForm.controls.start.enable();
				this.reportForm.controls.end.enable();
				return;
			}

			const { parsedStartDate, parsedEndDate } = getStartEndDate(undefined, undefined, value);
			this.reportForm.controls.start.disable();
			this.reportForm.controls.end.disable();
			// Update start and end dates only for predefined periods
			this.reportForm.controls.start.setValue(moment(parsedStartDate));
			this.reportForm.controls.end.setValue(moment(parsedEndDate));
		});

		effect(() => {
			if (this.data.status() === Status.SUCCESS) {
				this.closeDialog();
			}
		});

	}

	closeDialog(): void {
		this.dialogRef.close();
	}


	ngOnDestroy(): void {
		this.destroy$.next(true);
		this.destroy$.complete();
	}

	onSubmit = () => {
		if (this.reportForm.valid) {
			const start = this.reportForm.controls.start.value.toDate();
			const end = this.reportForm.controls.end.value.toDate();
			const reportPeriod = this.reportForm.controls.reportPeriod.value;

			this.data.getReport({
				report: this.data.reportName,
				reportPeriod,
				startDate: start,
				endDate: end
			});

		}
	}
}
