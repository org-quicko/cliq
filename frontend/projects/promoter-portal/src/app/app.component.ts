import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ProgramStore } from './store/program.store';
import { ThemeService, ColorUtil } from '@org.quicko.cliq/ngx-core';
import * as moment from 'moment';
import { filter } from 'rxjs';
import { Title } from '@angular/platform-browser';

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

	constructor(private router: Router, private titleService: Title) {
		moment.updateLocale('en', {
			week: { dow: 1 } // setting monday as the start of the week
		});

		effect(() => {
			const themeColor =this.programStore.program()?.themeColor;
			ColorUtil.setThemeFromSeed(themeColor ?? '#4D5C92');

			const programName = this.programStore.program()?.name;
			if (programName) {
				this.titleService.setTitle(`${programName} | Affiliate Program`);
			}
		})
	}

	ngOnInit() {
		this.themeService.initializeTheme();
		// ColorUtil.setThemeFromSeed(`#4D5C92`);

		this.router.events
			.pipe(filter(event => event instanceof NavigationEnd))
			.subscribe(() => {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			});
	}
}
