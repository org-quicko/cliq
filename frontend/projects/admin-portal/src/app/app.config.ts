import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RxFormBuilder } from '@rxweb/reactive-form-validators';
import { createMongoAbility, PureAbility } from '@casl/ability';
import { UserAbility } from './permissions/ability';
import { RequestInterceptor } from '../app/interceptors/request.interceptor';

export const appConfig: ApplicationConfig = {
	providers: [
		provideAnimations(),
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes),
		{
			provide: HTTP_INTERCEPTORS,
			useClass: RequestInterceptor,
			multi: true,
		},
		{
			provide: PureAbility,
			useFactory: () => createMongoAbility<UserAbility>()
		},
		provideStoreDevtools({
			maxAge: 25, // Retains last 25 states
			autoPause: true, // Pauses recording actions and state changes when the extension window is not open
			trace: false, //  If set to true, will include stack trace for every dispatched action, so you can see it in trace tab jumping directly to that part of code
			traceLimit: 75, // maximum stack trace frames to be stored (in case trace option was provided as true)
			connectInZone: true // If set to true, the connection is established within the Angular zone
		}),
		provideHttpClient(withInterceptorsFromDi()),
		RxFormBuilder,
	]
};
