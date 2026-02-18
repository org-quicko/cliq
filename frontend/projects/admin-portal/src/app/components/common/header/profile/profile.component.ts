import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { AvatarModule } from 'ngx-avatars';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Theme, ThemeService } from '@org.quicko.cliq/ngx-core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { ProgramStore } from '../../../../store/program.store';
import { ProgramUserStore } from '../../../../store/program-user.store';
import { UserStore } from '../../../../store/user.store';
import { ProgramUserDto } from '@org.quicko.cliq/ngx-core';

@Component({
	selector: 'app-profile',
	imports: [
		AvatarModule,
		MatMenuModule,
		MatIconModule,
		MatDividerModule,
		CommonModule,
		TitleCasePipe,
		MatButtonToggleModule,
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

	readonly userName = computed(() => {
		const user = this.userStore.user();
		if (user?.firstName && user?.lastName) {
			return `${user.firstName} ${user.lastName}`;
		} else if (user?.firstName) {
			return user.firstName;
		} else if (user?.lastName) {
			return user.lastName;
		}
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

	readonly userRole = computed(() => {
		const roleFromStore = this.programUserStore.role();
		if (roleFromStore) {
			return roleFromStore;
		}
		const currentProgramId = this.programId();
		const programs = this.programs();
		if (currentProgramId && programs.length > 0) {
			const currentProgram = programs.find(
				(p: ProgramUserDto) => p.programId === currentProgramId
			);
			return currentProgram?.role || null;
		}
		return null;
	});

	userEmail = signal<string | null>(null);

	// Theme toggle additions
	selectedThemePreference: Theme = Theme.SYSTEM;
	theme$!: Observable<Theme>;
	themeIconMap = new Map<Theme, string>([
		[Theme.SYSTEM, 'laptop_windows'],
		[Theme.LIGHT, 'clear_day'],
		[Theme.DARK, 'dark_mode'],
	]);
	destroy$ = new Subject<void>();

	constructor(
		private router: Router,
		private authService: AuthService,
		private themeService: ThemeService
	) {
		effect(() => {
			const programId = this.programId();
			if (programId) {
				this.programUserStore.setRoleFromProgram(programId);
			}
		});
		this.selectedThemePreference = Theme.SYSTEM;
	}

	ngOnInit() {
		const email = this.authService.getUserEmail();
		this.userEmail.set(email);
		this.theme$ = this.themeService.theme$;
		this.theme$.pipe(takeUntil(this.destroy$)).subscribe((res) => {
			this.selectedThemePreference = res;
		});
	}

	changeTheme(event: MatButtonToggleChange) {
		this.themeService.setTheme(event.value);
	}

	logout() {
		this.authService.deleteToken();
		window.location.href = `${window.location.origin}/admin/login`;
	}
}
