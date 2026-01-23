import {
	HttpEvent,
	HttpHandler,
	HttpInterceptor,
	HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable()
export class RequestInterceptor implements HttpInterceptor {
	constructor(public authService: AuthService, private router: Router) { }

	intercept(
		request: HttpRequest<any>,
		next: HttpHandler
	): Observable<HttpEvent<any>> {

		if (this.authService.isAuthenticated()) {
			request = request.clone({
				setHeaders: {
					Authorization: this.authService.getToken(),
				},
			});
		} 
		return next.handle(request);
	}
}
