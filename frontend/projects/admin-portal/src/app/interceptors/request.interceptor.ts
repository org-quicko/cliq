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
			const userId = this.authService.getUserId();
			const headers: any = {
				Authorization: this.authService.getToken(),
			};
			
			// Add user_id header if available
			if (userId) {
				headers['user_id'] = userId;
				console.log('[RequestInterceptor] Adding user_id header:', userId, 'for URL:', request.url);
			} else {
				console.warn('[RequestInterceptor] No userId found in token for URL:', request.url);
			}

			request = request.clone({
				setHeaders: headers,
			});
		} 
		return next.handle(request);
	}
}
