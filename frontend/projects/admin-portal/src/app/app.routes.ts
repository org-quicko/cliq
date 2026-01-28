import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { HomeComponent } from './components/home/home.component';
import { ProgramResolver } from '../app/resolver/program.resolver';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { ReportsComponent } from './components/home/components/reports/reports.component';
import { PromotersComponent } from './components/home/components/promoters/promoters.component';
import { CirclesComponent } from './components/home/components/circles/circles.component';
import { ReferralsComponent } from './components/home/components/referrals/referrals.component';
import { DashboardComponent } from './components/home/components/dashboard/dashboard.component';

export const routes: Routes = [
    { path: '404', component: NotFoundComponent },
    {
        resolve: { program: ProgramResolver },
        path: 'admin/:program_id',
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
                    { path: 'dashboard', component: DashboardComponent },
                    { path: 'referrals', component: ReferralsComponent },
                    { path: 'reports', component: ReportsComponent },
                    { path: 'circles', component: CirclesComponent },
                    { path: 'promoters', component: PromotersComponent },
                ]
            },
        ],
    },
    { path: '**', redirectTo: '404' },
];