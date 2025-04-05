import { TitleCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterOutlet, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';

@Component({
	selector: 'app-settings',
	imports: [MatTabsModule, MatDividerModule, RouterOutlet, RouterLink, RouterLinkActive, TitleCasePipe],
	templateUrl: './settings.component.html',
	styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit, OnDestroy {

	destroy$ = new Subject<void>();

	tabs = ['profile', 'promoter', 'team'];

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
