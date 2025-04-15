import { inject, Injectable } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { ActivatedRoute, ActivatedRouteSnapshot, CanActivateChild, Router } from "@angular/router";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class IsLoggedIn implements CanActivateChild {
    constructor(private authService: AuthService, private router: Router) { }

    canActivateChild(route: ActivatedRouteSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        if(this.authService.isAuthenticated()){
            return true;
        } else {
			const programId = route.paramMap.get('program_id');

            this.router.navigate([`${programId}/login`]);
            return false;
        }
    }
}
