import { Component } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';

@Component({
	selector: 'app-settings',
	imports: [MatTabsModule, MatDividerModule, RouterOutlet, RouterLink, RouterLinkActive],
	templateUrl: './settings.component.html',
	styleUrl: './settings.component.css',
})
export class SettingsComponent {}
