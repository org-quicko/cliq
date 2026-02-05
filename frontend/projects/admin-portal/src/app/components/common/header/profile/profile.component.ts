import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { AvatarModule } from 'ngx-avatars';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { ProgramStore } from '../../../../store/program.store';
import { ProgramsListStore, ProgramWithRole } from '../../../../store/programs-list.store';

@Component({
	selector: 'app-profile',
	imports: [
		AvatarModule,
		MatMenuModule,
		MatIconModule,
		MatDividerModule,
		CommonModule,
		TitleCasePipe,
	],
	templateUrl: './profile.component.html',
	styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
	readonly programStore = inject(ProgramStore);
	readonly programsListStore = inject(ProgramsListStore);

	readonly programId = computed(() => this.programStore.program()?.programId);
	readonly programs = this.programsListStore.programs;

	userEmail = signal<string | null>(null);
	userName = signal<string>('Admin');
	userRole = signal<string | null>(null);

	constructor(
		private router: Router,
		private authService: AuthService
	) {
		// Set user role when programs are loaded
		effect(() => {
			const programs = this.programs();
			const programId = this.programId();
			if (programs.length > 0 && programId) {
				this.setUserRole();
			}
		});
	}

	ngOnInit() {
		// Get user email from JWT token
		const email = this.authService.getUserEmail();
		this.userEmail.set(email);

		// Get user name from JWT token
		this.setUserName();
	}

	setUserName() {
		// Get name from JWT token (User entity has firstName and lastName)
		const name = this.authService.getUserName();
		if (name) {
			this.userName.set(name);
		} else {
			// Fallback: extract name from email
			const email = this.userEmail();
			if (email) {
				const namePart = email.split('@')[0];
				const formattedName = namePart
					.replace(/[._]/g, ' ')
					.split(' ')
					.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
					.join(' ');
				this.userName.set(formattedName);
			}
		}
	}

	setUserRole() {
		const currentProgramId = this.programId();
		const programs = this.programs();
		
		if (currentProgramId && programs.length > 0) {
			const currentProgram = programs.find(
				(p: ProgramWithRole) => p.programId === currentProgramId
			);
			if (currentProgram?.role) {
				this.userRole.set(currentProgram.role);
			}
		}
	}

	goToSettings() {
		const programId = this.programId();
		if (programId) {
			this.router.navigate(['/', programId, 'home', 'settings']);
		}
	}

	logout() {
		this.authService.deleteToken();
		window.location.href = `${window.location.origin}/login`;
	}
}
