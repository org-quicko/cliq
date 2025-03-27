import { Component } from '@angular/core';
import { AvatarModule } from 'ngx-avatars';

@Component({
	selector: 'app-profile',
	imports: [AvatarModule],
	templateUrl: './profile.component.html',
	styleUrl: './profile.component.scss'
})
export class ProfileComponent {

}
