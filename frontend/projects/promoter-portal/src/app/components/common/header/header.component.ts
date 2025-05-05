import { Component, computed, inject } from '@angular/core';
import { ProfileComponent } from './profile/profile.component';
import { ProgramStore } from '../../../store/program.store';

@Component({
	selector: 'app-header',
	imports: [ProfileComponent],
	templateUrl: './header.component.html',
	styleUrl: './header.component.scss'
})
export class HeaderComponent {

	readonly programStore = inject(ProgramStore);

	readonly programName = computed(() => this.programStore.program()!.name);
}
