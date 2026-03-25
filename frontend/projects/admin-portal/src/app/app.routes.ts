import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { HomeComponent } from './components/home/home.component';
import { ProgramResolver } from '../app/resolver/program.resolver';
import { UserResolver } from '../app/resolver/user.resolver';
import { ProgramUserResolver } from '../app/resolver/program-user.resolver';
import { NotFoundComponent } from '@org.quicko.cliq/ngx-core';
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
import { ReferralsComponent } from './components/home/components/referrals/referrals.component';
import { PromotersComponent } from './components/home/components/promoters/promoters.component';
import { PromoterSummaryComponent } from './components/home/components/promoter-summary/promoter-summary.component';
import { PromoterLinksComponent } from './components/home/components/promoter-summary/promoter-links.component';
import { CirclesComponent } from './components/home/components/circles/circles.component';
import { CircleSummaryComponent } from './components/home/components/circle-summary/circle-summary.component';
import { CircleFunctionsComponent } from './components/home/components/circle-summary/circle-functions/circle-functions.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ProfileComponent } from './components/settings/profile/profile.component';
import { TeamComponent } from './components/settings/team/team.component';
import { ProgramProfileComponent } from './components/settings/program-profile/program-profile.component';
import { ApiKeysComponent } from './components/settings/api-keys/api-keys.component';
export const routes: Routes = [
    { path: '404', component: NotFoundComponent },
    { path: 'setup', component: SuperAdminSetupComponent },
    { path: 'login', component: LoginComponent },
    {
        path: '',
        resolve: { user: UserResolver },
        canActivate: [IsLoggedIn],
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'programs' },
            {
                path: 'programs',
                resolve: { programs: ProgramUserResolver },
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
                path: ':program_id',
                resolve: { 
                    program: ProgramResolver,
                    programs: ProgramUserResolver
                 },
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
                            { path: 'referrals' , component: ReferralsComponent},
                            { path: 'circles', component: CirclesComponent },
                            {
                                path: 'circles/:circle_id',
                                children: [
                                    { path: '', component: CircleSummaryComponent },
                                    { path: 'functions', component: CircleFunctionsComponent },
                                ]
                            },
                            {path: 'promoters', component: PromotersComponent},
                            {path: 'promoters/:promoter_id', component: PromoterSummaryComponent},
                            {path: 'promoters/:promoter_id/links', component: PromoterLinksComponent},
                            { path: 'reports', component: ReportsComponent },
                            { path: 'promoters-by-signups', component: PromotersBySignupsComponent },
                            { path: 'promoters-by-purchases', component: PromotersByPurchasesComponent },
                            {
                                path: 'settings',
                                component: SettingsComponent,
                                children: [
                                    { path: '', redirectTo: 'Profile', pathMatch: 'full' },
                                    { path: 'Profile', component: ProfileComponent },
                                    { path: 'Program', component: ProgramProfileComponent },
                                    { path: 'Team', component: TeamComponent },
                                    { path: 'api-keys', component: ApiKeysComponent },
                                ]
                            }
                        ]
                    },
                ],
            },
        ],
    },
    { path: '**', redirectTo: '404' },
];