import { Component } from '@angular/core';
import { ProfileComponent } from './profile/profile.component';
import { ChooseProgramComponent } from './choose-program/choose-program.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
	selector: 'app-header',
	imports: [ChooseProgramComponent, ProfileComponent, MatIconModule],
	templateUrl: './header.component.html',
	styleUrl: './header.component.css'
})
export class HeaderComponent {
}
