import { Component, computed, inject } from '@angular/core';
import { ProfileComponent } from './profile/profile.component';
import { ProgramStore } from '../../../store/program.store';
import { LogoComponent } from '../logo/logo.component';

@Component({
	selector: 'app-header',
	imports: [ProfileComponent, LogoComponent],
	templateUrl: './header.component.html',
	styleUrl: './header.component.css'
})
export class HeaderComponent {

	readonly programStore = inject(ProgramStore);

	readonly programName = computed(() => this.programStore.program()!.name);
}
