import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';


@Injectable({
	providedIn: 'root'
})
export class IsLoggedIn implements CanActivate, CanActivateChild {
	constructor(
		private authService: AuthService,
		private router: Router
	) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
		return this.checkAuth(state.url);
	}

	canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
		return this.checkAuth(state.url);
	}

	private checkAuth(url: string): boolean {
		if (this.authService.isAuthenticated()) {
			return true;
		}


		this.router.navigate(['/login']);
		return false;
	}
}
