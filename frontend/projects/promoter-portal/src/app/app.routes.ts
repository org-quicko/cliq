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
import { LinkCommissionsComponent } from './components/home/components/dashboard/components/link-commissions/link-commissions.component';
import { ReferralCommissionsComponent } from './components/home/components/referrals/referral-commissions/referral-commissions.component';
import { LayoutComponent } from './components/layout/layout.component';
import { ProfileComponent } from './components/settings/components/profile/profile.component';
import { PromoterComponent } from './components/settings/components/promoter/promoter.component';
import { TeamComponent } from './components/settings/components/team/team.component';

export const routes: Routes = [
	{
		resolve: { program: ProgramResolver },
		path: ':program_id',
		children: [
			{
				canActivate: [isLoggedIn],
				resolve: {
					member: MemberResolver,
					promoter: PromoterResolver,
				},
				path: '',
				component: LayoutComponent,
				children: [
					{
						path: 'home',
						component: HomeComponent,
						children: [
							{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
							{
								path: 'dashboard',
								children: [
									{
										path: '',
										pathMatch: 'full',
										component: DashboardComponent
									},
									{
										path: 'links/:link_id/commissions',
										component: LinkCommissionsComponent
									}
								]

							},
							{
								path: 'referrals',
								children: [
									{
										path: '',
										pathMatch: 'full',
										component: ReferralsComponent
									},
									{
										path: 'referrals/:contact_id/commissions',
										component: ReferralCommissionsComponent
									}
								]
							},
							{ path: 'reports', component: ReportsComponent },
						]
					},
					{
						path: 'settings',
						component: SettingsComponent,
						children: [
							{ path: '', redirectTo: 'profile', pathMatch: 'full' },
							{
								path: 'profile',
								component: ProfileComponent
							},
							{
								path: 'promoter',
								component: PromoterComponent
							},
							{
								path: 'team',
								component: TeamComponent
							},
						]
					},
				],
			},
			{ path: 'login', component: LoginComponent },
			{ path: 'signup', component: SignUpComponent },
		],
	},
	{ path: '**', component: NotFoundComponent },
];
