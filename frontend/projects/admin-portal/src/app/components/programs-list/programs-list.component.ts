import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { MatDividerModule } from '@angular/material/divider';
import { ProgramsListStore } from '../../store/programs-list.store';
import { Status } from '@org.quicko.cliq/ngx-core';

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
	programsListStore = inject(ProgramsListStore);

	programs = this.programsListStore.programs;
	isLoading = () => this.programsListStore.status() === Status.PENDING;

	constructor(private router: Router) {}

	ngOnInit() {
		this.programsListStore.fetchPrograms();
	}

	onClick(programId: string) {
		// Defensive: handle both program_id and programId

		if (!programId) {
			return;
		}
		this.router.navigate(['/', programId, 'home', 'dashboard']);
	}
}
