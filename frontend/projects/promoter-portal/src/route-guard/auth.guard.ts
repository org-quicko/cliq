import { Injectable } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { CanActivate, Router } from "@angular/router";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class isLoggedIn implements CanActivate {
    constructor(private authService: AuthService, private router: Router) { }

    canActivate(): Observable<boolean> | Promise<boolean> | boolean {
        if(this.authService.isAuthenticated()){
            return true;
        } else {
            // this.router.navigate(['/accounts/login']);
            return false;
        }
    }
}
