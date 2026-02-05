import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { PermissionsService } from '../services/permission.service';

/**
 * Guard to check if user has Admin role in the current program
 * Used for routes that require admin access within a program context
 * Redirects to program dashboard if not an admin
 */
@Injectable({
	providedIn: 'root'
})
export class IsAdmin implements CanActivate {
	private readonly permissionsService = inject(PermissionsService);
	private readonly router = inject(Router);

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
		// Super admins always have access
		if (this.permissionsService.isSuperAdmin()) {
			return true;
		}

		// Check if user is admin in the current program
		if (this.permissionsService.isAdmin()) {
			return true;
		}

		// Not an admin, redirect to program home
		const programId = route.paramMap.get('program_id') || this.permissionsService.currentProgramId();
		if (programId) {
			this.router.navigate([`/${programId}/home`]);
		} else {
			this.router.navigate(['/programs']);
		}
		return false;
	}
}
