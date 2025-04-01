import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProgramStore } from './store/program.store';
import { ThemeService, ColorUtil } from '@org.quicko.cliq/ngx-core';
import * as moment from 'moment';

@Component({
	selector: 'app-root',
	imports: [RouterOutlet,],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

	readonly programStore = inject(ProgramStore);

	readonly themeService = inject(ThemeService);

	title = computed(() => this.programStore.program()?.name);

	constructor() {
		moment.updateLocale('en', {
			week: { dow: 1 } // setting monday as the start of the week
		});
	}

	ngOnInit() {
		this.themeService.initializeTheme();
		ColorUtil.setThemeFromSeed(`#4D5C92`);
	}
}
