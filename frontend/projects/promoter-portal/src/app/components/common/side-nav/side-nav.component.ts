import { Component } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from "@angular/material/list"
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-side-nav',
	standalone: true,
	imports: [MatSidenavModule, MatIconModule, MatListModule, RouterLinkActive, RouterLink, CommonModule],
	templateUrl: './side-nav.component.html',
	styleUrl: './side-nav.component.scss',
})
export class SideNavComponent {
	constructor(private router: Router, private route: ActivatedRoute) { }


}
