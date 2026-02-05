import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { PermissionsService } from '../services/permission.service';


@Injectable({
	providedIn: 'root'
})
export class IsAdmin implements CanActivate {
	private readonly permissionsService = inject(PermissionsService);
	private readonly router = inject(Router);

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

		if (this.permissionsService.isSuperAdmin()) {
			return true;
		}


		if (this.permissionsService.isAdmin()) {
			return true;
		}

		const programId = route.paramMap.get('program_id') || this.permissionsService.currentProgramId();
		if (programId) {
			this.router.navigate([`/${programId}/home`]);
		} else {
			this.router.navigate(['/programs']);
		}
		return false;
	}
}
