import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProgramStore } from './store/program.store';
import { ThemeService, ColorUtil } from '@org.quicko.cliq/ngx-core';


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

	constructor() { }

	ngOnInit() {
		this.themeService.initializeTheme();
		ColorUtil.setThemeFromSeed(`#4D5C92`);
	}
}
