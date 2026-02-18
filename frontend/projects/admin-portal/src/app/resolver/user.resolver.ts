import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { UserStore } from '../store/user.store';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { PermissionsService } from '../services/permission.service';
import { Observable, of, tap } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import { UserDto } from '@org.quicko.cliq/ngx-core';

@Injectable({
	providedIn: 'root',
})
export class UserResolver {

	private authService = inject(AuthService);
	private userStore = inject(UserStore);
	private userService = inject(UserService);
	private permissionsService = inject(PermissionsService);

	constructor(private router: Router) {}

	resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
		const userId = this.authService.getUserId();

		if (userId) {
			return this.userService.getUser(userId).pipe(
				tap((response) => {
					if (response.data) {
						const user = plainToInstance(UserDto, response.data);
						this.userStore.setUser(user);
						if (user.role) {
							this.permissionsService.setUserRole(user.role);
						}
					}
				})
			);
		} else {
			this.router.navigate(['/login']);
			return of(null);
		}
	}
}
