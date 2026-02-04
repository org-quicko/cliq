import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AvatarModule } from 'ngx-avatars';
import { MatRippleModule } from '@angular/material/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ProgramStore } from '../../../../store/program.store';
import { ProgramsListStore, ProgramWithRole } from '../../../../store/programs-list.store';
import { Status } from '@org.quicko.cliq/ngx-core';

@Component({
	selector: 'app-choose-program',
	imports: [
		MatIconModule,
		MatMenuModule,
		CommonModule,
		AvatarModule,
		MatRippleModule,
		NgxSkeletonLoaderModule,
		TitleCasePipe,
	],
	templateUrl: './choose-program.component.html',
	styleUrl: './choose-program.component.css',
})
export class ChooseProgramComponent implements OnInit {
	currentProgramId: string = '';
	currentProgram = signal<ProgramWithRole | null>(null);

	programStore = inject(ProgramStore);
	programsListStore = inject(ProgramsListStore);

	isLoading = computed(() => this.programsListStore.status() === Status.PENDING);
	programs = this.programsListStore.programs;
	program = this.programStore.program;
	isSuperAdmin = this.programsListStore.isSuperAdmin;

	// Limit dropdown to show at most 5 programs
	displayedPrograms = computed(() => this.programs().slice(0, 5));

	constructor(
		private route: ActivatedRoute,
		private router: Router
	) {
		effect(() => {
			const programs = this.programs();
			const status = this.programsListStore.status();
			const currentProgFromStore = this.program();

			if (programs.length > 0) {
				this.setCurrentProgram();
			}

			// Fallback for super admin: if programs loaded but currentProgram not found in list,
			// use the program from programStore (set by route resolver)
			if (status === Status.SUCCESS && !this.currentProgram() && currentProgFromStore) {
				this.currentProgram.set({
					...currentProgFromStore,
					role: this.isSuperAdmin() ? 'super_admin' : undefined
				} as ProgramWithRole);
			}
		});
	}

	ngOnInit(): void {
		this.route.params.subscribe((params: Params) => {
			this.currentProgramId = params['program_id'];
		});

		// Fetch programs if not already loaded
		if (this.programsListStore.status() !== Status.SUCCESS) {
			this.programsListStore.fetchPrograms();
		}
	}

	setCurrentProgram() {
		this.programs().forEach((program: ProgramWithRole) => {
			if (program.programId === this.currentProgramId) {
				this.currentProgram.set(program);
			}
		});
	}

	changeProgram(program: ProgramWithRole) {
		// Navigate to the selected program's dashboard
		const currentUrl = window.location.pathname;
		const urlParts = currentUrl.split('/');
		
		// Find and replace the program_id in the URL
		const programIdIndex = urlParts.findIndex(part => part === this.currentProgramId);
		if (programIdIndex !== -1) {
			urlParts[programIdIndex] = program.programId!;
			window.location.href = `${window.location.origin}${urlParts.join('/')}`;
		} else {
			// Fallback: navigate to the program's dashboard
			window.location.href = `${window.location.origin}/admin/${program.programId}/home/dashboard`;
		}
	}

	onViewAllPrograms() {
		console.log('[ChooseProgram] isSuperAdmin:', this.isSuperAdmin());
		if (this.isSuperAdmin()) {
			console.log('[ChooseProgram] Navigating to /admin/programs/summary');
			this.router.navigate(['/admin/programs/summary']);
		} else {
			console.log('[ChooseProgram] Navigating to /admin/programs');
			this.router.navigate(['/admin/programs']);
		}
	}
}
