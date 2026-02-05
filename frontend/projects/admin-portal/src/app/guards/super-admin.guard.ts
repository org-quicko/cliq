import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';


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

		this.router.navigate(['/programs']);
		return false;
	}
}
