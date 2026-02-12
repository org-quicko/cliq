import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ProgramStore } from './store/program.store';
import { ThemeService, ColorUtil } from '@org.quicko.cliq/ngx-core';
import * as moment from 'moment';
import { filter } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
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
        const programName = this.programStore.program()?.name;
        if (programName) {
          this.titleService.setTitle(`${programName} | Affiliate Program`);
        }
  
  
        const favicon: HTMLLinkElement | null = document.getElementById('appFavicon') as HTMLLinkElement;
        const logoUrl = this.programStore.program()?.logoUrl;
        if (favicon && logoUrl) {
          favicon.href = logoUrl; 
        }
      })
    }
  
    ngOnInit() {
      this.themeService.initializeTheme();
      ColorUtil.setThemeFromSeed(`#4D5C92`);
      
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
  }
