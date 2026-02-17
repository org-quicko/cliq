import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component,effect, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AvatarModule } from 'ngx-avatars';
import { MatRippleModule } from '@angular/material/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ProgramStore } from '../../../../store/program.store';
import { ProgramUserStore, ProgramWithRole } from '../../../../store/program-user.store';
import { PermissionsService } from '../../../../services/permission.service';
import { userRoleEnum } from '@org.quicko.cliq/ngx-core';

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
	currentProgramId = signal<string>('');
	currentProgram = signal<ProgramWithRole | null>(null);

	programStore = inject(ProgramStore);
	programUserStore = inject(ProgramUserStore);

	isLoading = this.programUserStore.isLoading;
	programs = this.programUserStore.programs;
	program = this.programStore.program;

	displayedPrograms = this.programs().slice(0, 5);

	constructor(
		private route: ActivatedRoute,
		private permissionService: PermissionsService,
		private router: Router
	) {
		effect(() => {
			const programId = this.currentProgramId();
			const programs = this.programs();
			if (programId && programs.length > 0) {
				this.getPrograms();
			}
		});
	}

	ngOnInit(): void {
		this.route.params.subscribe((params: Params) => {
			this.currentProgramId.set(params['program_id']);
		});
	}

	getPrograms() {
		this.programs().forEach((program: ProgramWithRole) => {
			if (program.programId === this.currentProgramId()) {
				this.currentProgram.set(program);
				if (program.role) {
					this.permissionService.setAbilityForRole(program.role as userRoleEnum);
				}
			}
		});
	}

	changeProgram(program: ProgramWithRole) {
		this.router.navigate(['/', program.programId, 'home', 'dashboard']);
	}

	onViewAllPrograms() {
		this.router.navigate(['/programs']);
	}
}
