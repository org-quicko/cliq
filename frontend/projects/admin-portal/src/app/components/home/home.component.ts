import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../common/header/header.component';
import { SideNavComponent } from '../common/side-nav/side-nav.component';

@Component({
	selector: 'app-home',
	imports: [RouterOutlet, HeaderComponent, SideNavComponent],
	templateUrl: './home.component.html',
	styleUrl: './home.component.css',
	standalone: true,
})
export class HomeComponent { }
