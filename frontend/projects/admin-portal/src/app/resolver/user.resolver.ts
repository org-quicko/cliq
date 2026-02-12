import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { UserStore } from '../store/user.store';
import { AuthService } from '../services/auth.service';

@Injectable({
	providedIn: 'root',
})
export class UserResolver {

	private authService = inject(AuthService);
	private userStore = inject(UserStore);

	constructor(private router: Router) {}

	resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		const userId = this.authService.getUserId();

		if (userId) {
			this.userStore.fetchUser({ userId });
		} else {
			this.router.navigate(['/login']);
		}
	}
}
