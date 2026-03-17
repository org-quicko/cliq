import { Component, inject } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { TeamStore } from './store/team.store';
import { ApiKeysStore } from './store/api-keys.store';

@Component({
	selector: 'app-settings',
	imports: [MatTabsModule, MatDividerModule, RouterOutlet, RouterLink, RouterLinkActive],
	providers: [TeamStore, ApiKeysStore],
	templateUrl: './settings.component.html',
	styleUrl: './settings.component.css',
})
export class SettingsComponent {
	readonly teamStore = inject(TeamStore);
	readonly apiKeysStore = inject(ApiKeysStore);
}
