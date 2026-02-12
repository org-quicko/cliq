import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { UserStore } from '../store/user.store';
import { AuthService } from '../services/auth.service';
import { UserDto } from '@org.quicko.cliq/ngx-core';

@Injectable({
	providedIn: 'root',
})
export class UserResolver {

	private authService = inject(AuthService);
	private userStore = inject(UserStore);

	constructor(private router: Router) {}

	async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<UserDto | void> {
		const userId = this.authService.getUserId();

		if (!userId) {
			this.router.navigate(['/login']);
			return;
		}

		const currentUser = this.userStore.user();
		if (currentUser?.userId === userId && !this.userStore.isLoading()) {
			return currentUser;
		}

		this.userStore.fetchUser({ userId });

		return new Promise((resolve) => {
			const checkUser = setInterval(() => {
				const user = this.userStore.user();
				const isLoading = this.userStore.isLoading();
				
				if (!isLoading && user) {
					clearInterval(checkUser);
					resolve(user);
				}
			}, 50);
		});
	}
}
