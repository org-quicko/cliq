import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideNavComponent } from '../components/side-nav/side-nav.component';
import { HeaderComponent } from '../components/header/header.component';

@Component({
	selector: 'app-layout',
	imports: [SideNavComponent, HeaderComponent, RouterOutlet],
	templateUrl: './layout.component.html',
	styleUrl: './layout.component.scss'
})
export class LayoutComponent {

}
