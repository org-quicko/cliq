import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
	selector: 'app-skeleton-load-table',
	imports: [
		NgxSkeletonLoaderModule,
		MatTableModule,
		CommonModule
	],
	templateUrl: './skeleton-load-table.component.html',
	styleUrl: './skeleton-load-table.component.scss'
})
export class SkeletonLoadTableComponent implements OnInit {
	@Input({ required: true }) maxHeight: string;
	@Input({ required: true }) rowCount: number;

	@Input() headerClass: string;
	@Input() rowClass: string;

	@Input() headers: {
		theme: Record<string, string>;
	}[] = [];

	@Input() rows: {
		theme: Record<string, string>;
	}[] = [];


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
		console.log(themeCopy);
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
