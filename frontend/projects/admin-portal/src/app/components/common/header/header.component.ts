import { Component } from '@angular/core';
import { ProfileComponent } from './profile/profile.component';
import { ChooseProgramComponent } from './choose-program/choose-program.component';

@Component({
	selector: 'app-header',
	imports: [ChooseProgramComponent, ProfileComponent],
	templateUrl: './header.component.html',
	styleUrl: './header.component.css'
})
export class HeaderComponent {
}
