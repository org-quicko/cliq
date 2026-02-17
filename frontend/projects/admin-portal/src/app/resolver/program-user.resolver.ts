import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ProgramUserStore } from '../store/program-user.store';

@Injectable({
	providedIn: 'root',
})
export class ProgramUserResolver {

	private programUserStore = inject(ProgramUserStore);

	resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
			this.programUserStore.fetchPrograms();		
	}
}
