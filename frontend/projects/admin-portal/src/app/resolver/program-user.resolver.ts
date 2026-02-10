import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { combineLatest, filter, firstValueFrom, map } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { ProgramUserStore, ProgramWithRole } from '../store/program-user.store';
import { Status } from '@org.quicko.cliq/ngx-core';

@Injectable({
	providedIn: 'root',
})
export class ProgramUserResolver {

	private programUserStore = inject(ProgramUserStore);

	// Create observables in injection context (field initializer)
	private programs$ = toObservable(this.programUserStore.programs);
	private status$ = toObservable(this.programUserStore.status);

	async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<ProgramWithRole[]> {
		// Check if programs are already loaded
		const currentPrograms = this.programUserStore.programs();
		if (currentPrograms.length > 0 && this.programUserStore.status() === Status.SUCCESS) {
			return currentPrograms;
		}

		// Fetch programs for user
		this.programUserStore.fetchPrograms();

		// Wait for programs to be loaded
		const programs = await firstValueFrom(
			combineLatest([this.programs$, this.status$]).pipe(
				filter(([p, status]) => status === Status.SUCCESS && p.length > 0),
				map(([p]) => p as ProgramWithRole[])
			)
		);

		return programs;
	}
}
