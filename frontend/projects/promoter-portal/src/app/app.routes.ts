import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { MemberResolver } from './resolver/member.resolver';
import { ProgramResolver } from './resolver/program.resolver';
import { isLoggedIn } from './route-guard/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { SignUpComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/home/components/dashboard/dashboard.component';
import { ReferralsComponent } from './components/home/components/referrals/referrals.component';
import { ReportsComponent } from './components/home/components/reports/reports.component';
import { SettingsComponent } from './components/home/components/settings/settings.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { PromoterResolver } from './resolver/promoter.resolver';

export const routes: Routes = [
	{
		resolve: { program: ProgramResolver },
		path: ':program_id',
		children: [
			{
				canActivate: [isLoggedIn],
				resolve: {
					member: MemberResolver,
					promoter: PromoterResolver
				},
				path: 'home',
				component: HomeComponent,
				children: [
					{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
					{ path: 'dashboard', component: DashboardComponent },
					{ path: 'referrals', component: ReferralsComponent },
					{ path: 'reports', component: ReportsComponent },
					{ path: 'settings', component: SettingsComponent },
				],
			},
			{ path: 'login', component: LoginComponent },
			{ path: 'signup', component: SignUpComponent },
		],
	},
	{ path: '**', component: NotFoundComponent },
];
