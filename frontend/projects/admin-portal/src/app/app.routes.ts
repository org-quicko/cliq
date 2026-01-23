import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { HomeComponent } from './components/home/home.component';
import { ProgramResolver } from '../app/resolver/program.resolver';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { ReportsComponent } from './components/home/components/reports/reports.component';

export const routes: Routes = [
    { path: '404', component: NotFoundComponent },
    {
        resolve: { program: ProgramResolver },
        path: ':program_id',
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'home',
            },
            {
                path: 'home',
                component: LayoutComponent,
                   children: [
                    { path: '', component: HomeComponent },
                    { path: 'dashboard', component: HomeComponent },
                    { path: 'referrals', component: HomeComponent },
                    { path: 'reports', component: ReportsComponent },
                ]
            },
        ],
    },
    { path: '**', redirectTo: '404' },
];