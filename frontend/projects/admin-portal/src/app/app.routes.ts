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
import { PromotersBySignupsComponent } from './components/home/components/promoters-by-signups/promoters-by-signups.component';
import { PromotersByPurchasesComponent } from './components/home/components/promoters-by-purchases/promoters-by-purchases.component';
import { LoginComponent } from './components/login/login.component';
import { ProgramsListComponent } from './components/programs-list/programs-list.component';
import { SuperAdminSetupComponent } from './components/super-admin-setup/super-admin-setup.component';
import { SuperAdminProgramsComponent } from './components/super-admin-programs/super-admin-programs.component';
import { CreateProgramContainerComponent } from './components/create-program-container/create-program-container.component';
import { CreateProgramComponent } from './components/create-program-container/create-program/create-program.component';
import { IsLoggedIn, IsSuperAdmin } from './guards';

export const routes: Routes = [
    { path: '404', component: NotFoundComponent },
    { path: 'setup', component: SuperAdminSetupComponent },
    { path: 'login', component: LoginComponent },
     { 
        path: 'programs/summary', 
        component: SuperAdminProgramsComponent,
        canActivate: [IsLoggedIn, IsSuperAdmin]
    },
    { 
        path: 'programs', 
        component: ProgramsListComponent,
        canActivate: [IsLoggedIn]
    },
   
    {
        path: 'programs/create',
        component: CreateProgramContainerComponent,
        canActivate: [IsLoggedIn],
        children: [
            { path: '', component: CreateProgramComponent },
        ],
    },
    {
        resolve: { program: ProgramResolver },
        path: ':program_id',
        canActivate: [IsLoggedIn],
        canActivateChild: [IsLoggedIn],
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
                    { path: 'promoters-by-signups', component: PromotersBySignupsComponent },
                    { path: 'promoters-by-purchases', component: PromotersByPurchasesComponent },
                ]
            },
        ],
    },
    { path: '**', redirectTo: '404' },
];