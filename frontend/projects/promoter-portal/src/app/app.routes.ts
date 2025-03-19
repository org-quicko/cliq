import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MemberResolver } from '../resolver/member.resolver';

export const routes: Routes = [
	{
		path: 'programs/:program_id/accounts',
		loadChildren: () =>
			import('./accounts/accounts-routing.module').then(
				(m) => m.routes
			),
	},
	{
		resolve: { member: MemberResolver },
		path: 'programs/:program_id',
		component: HomeComponent
	},
    { path: '', redirectTo: 'programs/:program_id/accounts/login', pathMatch: 'full' },
    { path: '**', redirectTo: 'programs/:program_id/accounts/login' },
];
