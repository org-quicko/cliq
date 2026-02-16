import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { HomeComponent } from './components/home/home.component';
import { ProgramResolver } from '../app/resolver/program.resolver';
import { UserResolver } from '../app/resolver/user.resolver';
import { ProgramUserResolver } from '../app/resolver/program-user.resolver';
import { NotFoundComponent } from '../../../org-quicko-cliq-ngx-core/src/lib/components/not-found/not-found.component';
import { ReportsComponent } from './components/home/components/reports/reports.component';
import { DashboardComponent } from './components/home/components/dashboard/dashboard.component';
import { PromotersBySignupsComponent } from './components/home/components/promoters-by-signups/promoters-by-signups.component';
import { PromotersByPurchasesComponent } from './components/home/components/promoters-by-purchases/promoters-by-purchases.component';
import { LoginComponent } from './components/login/login.component';
import { SuperAdminSetupComponent } from './components/super-admin-setup/super-admin-setup.component';
import { SuperAdminProgramsComponent } from './components/super-admin-programs/super-admin-programs.component';
import { ProgramsListComponent } from './components/programs-list/programs-list.component';
import { CreateProgramContainerComponent } from './components/create-program-container/create-program-container.component';
import { CreateProgramComponent } from './components/create-program-container/create-program/create-program.component';
import { DynamicComponentLoaderComponent } from './components/dynamic-component-loader/dynamic-component-loader.component';
import { IsLoggedIn } from './guards';

export const routes: Routes = [
    { path: '404', component: NotFoundComponent },
    { path: 'setup', component: SuperAdminSetupComponent },
    { path: 'login', component: LoginComponent },
    {
        path: '',
        resolve: { user: UserResolver, programs: ProgramUserResolver },
        canActivate: [IsLoggedIn],
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'programs' },
            {
                path: 'programs',
                component: DynamicComponentLoaderComponent,
                data: {
                    SuperAdminComponent: SuperAdminProgramsComponent,
                    DefaultComponent: ProgramsListComponent,
                },
            },
            {
                path: 'programs/summary',
                component: SuperAdminProgramsComponent,
            },
            {
                path: 'programs/create',
                component: CreateProgramContainerComponent,
                children: [
                    { path: '', component: CreateProgramComponent },
                ],
            },
            {
                resolve: { program: ProgramResolver },
                path: ':program_id',
                children: [
                    {
                        path: 'home',
                        component: HomeComponent,
                        children: [
                            {
                                path: '',
                                pathMatch: 'full',
                                redirectTo: 'dashboard',
                            },
                            { path: 'dashboard', component: DashboardComponent },
                            { path: 'reports', component: ReportsComponent },
                            { path: 'promoters-by-signups', component: PromotersBySignupsComponent },
                            { path: 'promoters-by-purchases', component: PromotersByPurchasesComponent },
                        ]
                    },
                ],
            },
        ],
    },
    { path: '**', redirectTo: '404' },
];