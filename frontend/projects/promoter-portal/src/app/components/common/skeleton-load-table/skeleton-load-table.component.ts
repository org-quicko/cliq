import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { TableRowStyling } from '../../../interfaces';

@Component({
	selector: 'app-skeleton-load-table',
	imports: [
		NgxSkeletonLoaderModule,
		MatTableModule,
		CommonModule
	],
	templateUrl: './skeleton-load-table.component.html',
	styleUrl: './skeleton-load-table.component.css'
})
export class SkeletonLoadTableComponent implements OnInit {
	@Input({ required: true }) maxHeight: string;
	@Input({ required: true }) rowCount: number;

	@Input() headerClass: string;
	@Input() rowClass: string;

	@Input() headers: TableRowStyling[] = [];

	@Input() rows: TableRowStyling[] = [];


	defaultTheme: Record<string, string> = {
		width: '100%',
		height: '20px',
		display: 'block',
		'border-radius': 'var(--radius-md)'
	};

	colArray: Array<number> = [];
	rowArray: Array<number> = [];

	ngOnInit(): void {

		for (const row of this.rows) {
			row.theme['margin-bottom'] = '0px';
		}
	}

	removeMarginBottom(theme: Record<string, string>) {
		const themeCopy = Object.assign({}, theme);
		themeCopy['margin-bottom'] = '0px';
		return themeCopy;
	}

	addStyles(theme: Record<string, string>, ...styles: { [key: string]: string }[]) {
		let themeCopy = Object.assign({}, theme);
		themeCopy['margin-bottom'] = '0px';

		for (const style of styles) {
			themeCopy = { ...themeCopy, ...style };
		}
		return themeCopy;
	}
}
