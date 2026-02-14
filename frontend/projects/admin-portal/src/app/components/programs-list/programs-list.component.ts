import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { MatDividerModule } from '@angular/material/divider';
import { ProgramUserStore } from '../../store/program-user.store';

@Component({
	selector: 'app-programs-list',
	standalone: true,
	imports: [
		MatListModule,
		MatIconModule,
		MatDividerModule,
		CommonModule,
		NgxSkeletonLoaderModule,
	],
	templateUrl: './programs-list.component.html',
	styleUrl: './programs-list.component.css',
})
export class ProgramsListComponent implements OnInit {
	programUserStore = inject(ProgramUserStore);

	programs = this.programUserStore.programs;
	isLoading = this.programUserStore.isLoading;

	constructor(private router: Router) {}

	ngOnInit() {
		
	}

	onClick(programId: string) {
		this.router.navigate(['/', programId, 'home', 'dashboard']);
	}
}
