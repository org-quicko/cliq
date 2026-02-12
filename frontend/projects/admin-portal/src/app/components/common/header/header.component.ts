import { Component, computed, inject } from '@angular/core';
import { ProfileComponent } from './profile/profile.component';
import { ChooseProgramComponent } from './choose-program/choose-program.component';
import { ProgramStore } from '../../../store/program.store';

@Component({
	selector: 'app-header',
	imports: [ChooseProgramComponent, ProfileComponent],
	templateUrl: './header.component.html',
	styleUrl: './header.component.css'
})
export class HeaderComponent {

	readonly programStore = inject(ProgramStore);

	readonly programName = computed(() => this.programStore.program()!.name);
}
