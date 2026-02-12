import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ProgramUserStore, ProgramWithRole } from '../store/program-user.store';
import { Status } from '@org.quicko.cliq/ngx-core';

@Injectable({
	providedIn: 'root',
})
export class ProgramUserResolver {

	private programUserStore = inject(ProgramUserStore);

	async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<ProgramWithRole[]> {
		const currentPrograms = this.programUserStore.programs();
		if (currentPrograms.length > 0 && this.programUserStore.status() === Status.SUCCESS) {
			return currentPrograms;
		}

		this.programUserStore.fetchPrograms();

		return new Promise((resolve) => {
			const checkPrograms = setInterval(() => {
				const programs = this.programUserStore.programs();
				const status = this.programUserStore.status();
				
				if (status === Status.SUCCESS && programs.length > 0) {
					clearInterval(checkPrograms);
					resolve(programs);
				}
				if (status === Status.ERROR) {
					clearInterval(checkPrograms);
					resolve([]);
				}
			}, 50);
		});
	}
}
