import { TitleCasePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterOutlet, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { ApiKeysStore } from './store/api-keys.store';

@Component({
	selector: 'app-settings',
	imports: [MatTabsModule, MatDividerModule, RouterOutlet, RouterLink, RouterLinkActive, TitleCasePipe],
	providers: [ApiKeysStore],
	templateUrl: './settings.component.html',
	styleUrl: './settings.component.css',

})
export class SettingsComponent implements OnInit, OnDestroy {

	readonly apiKeysStore = inject(ApiKeysStore);

	destroy$ = new Subject<void>();

	tabs = [
		{ path: 'profile', label: 'Profile' },
		{ path: 'promoter', label: 'Promoter' },
		{ path: 'team', label: 'Team' },
		{ path: 'api-keys', label: 'API Keys' },
	];

	selectedTab: string = '';

	constructor(private router: Router) { }

	ngOnInit(): void {
		this.selectedTab = this.router.url.split('/').pop()!;

		this.router.events
			.pipe(
				filter((event) => event instanceof NavigationEnd),
				takeUntil(this.destroy$)
			)
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => {
				this.selectedTab = this.router.url.split('/').pop()!;
			});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
