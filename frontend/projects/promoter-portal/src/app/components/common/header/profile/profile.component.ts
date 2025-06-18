import { Component, computed, inject, OnInit } from '@angular/core';
import { AvatarModule } from 'ngx-avatars';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { EllipsisPipe, memberRoleEnum, Theme, ThemeService } from '@org.quicko.cliq/ngx-core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { MemberStore } from '../../../../store/member.store';
import { ProgramStore } from '../../../../store/program.store';
import { Observable, Subject, takeUntil } from 'rxjs';

@Component({
	selector: 'app-profile',
	imports: [
		AvatarModule,
		MatMenuModule,
		MatIconModule,
		MatDividerModule,
		CommonModule,
		MatButtonModule,
		MatButtonToggleModule,
		RouterLink,
		EllipsisPipe,
	],
	templateUrl: './profile.component.html',
	styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {

	readonly memberStore = inject(MemberStore);

	readonly programStore = inject(ProgramStore);

	readonly member = computed(() => this.memberStore.member());

	readonly displayName = computed(() => this.member()?.firstName + ' ' + this.member()?.lastName);

	readonly programId = computed(() => this.programStore.program()!.programId);

	selectedThemePreference: Theme;

	theme$!: Observable<Theme>;

	role: memberRoleEnum | undefined;

	destroy$ = new Subject<void>();

	themeIconMap = new Map<Theme, string>([
		[Theme.SYSTEM, 'laptop_windows'],
		[Theme.LIGHT, 'clear_day'],
		[Theme.DARK, 'dark_mode'],
	]);

	constructor(private authService: AuthService, private router: Router, private themeService: ThemeService) {
		this.selectedThemePreference = Theme.SYSTEM;
	}

	changeTheme(event: MatButtonToggleChange) {
		this.themeService.setTheme(event.value)
	}

	ngOnInit() {
		this.getRole();
		this.theme$ = this.themeService.theme$;
		this.theme$.pipe(takeUntil(this.destroy$)).subscribe((res) => {
			this.selectedThemePreference = res
		});
	}

	getRole() {
		this.role = this.memberStore.member()?.role;
	}

	logout() {
		this.authService.deleteToken();
		window.location.href = [window.location.origin, this.programId(), 'login'].join('/');
	}

}
