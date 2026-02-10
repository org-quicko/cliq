import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { combineLatest, filter, firstValueFrom, map } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { UserStore } from '../store/user.store';
import { AuthService } from '../services/auth.service';
import { UserDto } from '@org.quicko.cliq/ngx-core';

@Injectable({
	providedIn: 'root',
})
export class UserResolver {

	private authService = inject(AuthService);
	private userStore = inject(UserStore);

	// Create observables in injection context (constructor/field initializer)
	private user$ = toObservable(this.userStore.user);
	private isLoading$ = toObservable(this.userStore.isLoading);

	async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<UserDto | null> {
		const userId = this.authService.getUserId();

		if (!userId) {
			console.error('[UserResolver] No userId found in JWT');
			return null;
		}

		// Check if user is already loaded
		const currentUser = this.userStore.user();
		if (currentUser?.userId === userId && !this.userStore.isLoading()) {
			return currentUser;
		}

		// Fetch user from backend
		this.userStore.fetchUser({ userId });

		// Wait for the user to be loaded
		const user = await firstValueFrom(
			combineLatest([this.user$, this.isLoading$]).pipe(
				filter(([u, isLoading]) => u !== null && !isLoading),
				map(([u]) => u as UserDto)
			)
		);

		return user;
	}
}
