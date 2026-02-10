import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { AvatarModule } from 'ngx-avatars';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { ProgramStore } from '../../../../store/program.store';
import { ProgramUserStore, ProgramWithRole } from '../../../../store/program-user.store';
import { UserStore } from '../../../../store/user.store';

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
	readonly programUserStore = inject(ProgramUserStore);
	readonly userStore = inject(UserStore);

	readonly programId = computed(() => this.programStore.program()?.programId);
	readonly programs = this.programUserStore.programs;

	// Get user name from UserStore
	readonly userName = computed(() => {
		const user = this.userStore.user();
		if (user?.firstName && user?.lastName) {
			return `${user.firstName} ${user.lastName}`;
		} else if (user?.firstName) {
			return user.firstName;
		} else if (user?.lastName) {
			return user.lastName;
		}
		// Fallback: extract name from email
		const email = this.authService.getUserEmail();
		if (email) {
			const namePart = email.split('@')[0];
			return namePart
				.replace(/[._]/g, ' ')
				.split(' ')
				.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
				.join(' ');
		}
		return 'Admin';
	});

	// Get user role from ProgramUserStore
	readonly userRole = computed(() => {
		// First try to get role from current program user
		const roleFromStore = this.programUserStore.role();
		if (roleFromStore) {
			return roleFromStore;
		}
		// Fallback: get role from programs list
		const currentProgramId = this.programId();
		const programs = this.programs();
		if (currentProgramId && programs.length > 0) {
			const currentProgram = programs.find(
				(p: ProgramWithRole) => p.programId === currentProgramId
			);
			return currentProgram?.role || null;
		}
		return null;
	});

	userEmail = signal<string | null>(null);

	constructor(
		private router: Router,
		private authService: AuthService
	) {
		// Update ProgramUserStore when program changes
		effect(() => {
			const programId = this.programId();
			if (programId) {
				this.programUserStore.setRoleFromProgram(programId);
			}
		});
	}

	ngOnInit() {
		// Get user email from JWT token
		const email = this.authService.getUserEmail();
		this.userEmail.set(email);
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
