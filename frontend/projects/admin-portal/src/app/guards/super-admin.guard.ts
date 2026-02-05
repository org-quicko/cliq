import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Guard to check if user is a Super Admin
 * Used for routes like /programs/summary that require global admin access
 * Redirects to /programs if not a super admin
 */
@Injectable({
	providedIn: 'root'
})
export class IsSuperAdmin implements CanActivate {
	private readonly authService = inject(AuthService);
	private readonly router = inject(Router);

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
		if (this.authService.isSuperAdmin()) {
			return true;
		}

		// Not a super admin, redirect to programs list
		this.router.navigate(['/programs']);
		return false;
	}
}
