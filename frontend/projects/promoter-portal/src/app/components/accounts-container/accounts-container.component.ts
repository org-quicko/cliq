import { Component, inject } from '@angular/core';
import { ProgramStore } from '../../store/program.store';

@Component({
	selector: 'app-accounts-container',
	imports: [],
	templateUrl: './accounts-container.component.html',
	styleUrl: './accounts-container.component.css'
})
export class AccountsContainerComponent {
	readonly programStore = inject(ProgramStore);
}
