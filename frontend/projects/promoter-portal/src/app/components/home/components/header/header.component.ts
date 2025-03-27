import { Component } from '@angular/core';
import { ProfileComponent } from './profile/profile.component';

@Component({
	selector: 'app-header',
	imports: [ProfileComponent],
	templateUrl: './header.component.html',
	styleUrl: './header.component.scss'
})
export class HeaderComponent {

}
