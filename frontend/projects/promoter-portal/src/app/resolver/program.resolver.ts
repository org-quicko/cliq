import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { ProgramService } from '../services/program.service';
import { ProgramStore } from '../store/program.store';
import { plainToInstance } from 'class-transformer';
import { ProgramDto, SnackbarService, Status } from '@org.quicko.cliq/ngx-core';


@Injectable({ providedIn: 'root' })
export class ProgramResolver implements Resolve<ProgramDto> {
	constructor() { }

	readonly programStore = inject(ProgramStore);

	readonly programService = inject(ProgramService);
	readonly snackBarService = inject(SnackbarService);
	readonly router = inject(Router);

	resolve(route: ActivatedRouteSnapshot): Observable<ProgramDto> {
		const programId = route.paramMap.get('program_id'); // Get program_id from route
		if (!programId || programId == '') {
			this.router.navigate(['/404']);
			throw new Error('Program ID is missing in route');
		}

		return this.programService.getProgram(programId).pipe(
			tap((response) => {
				if (response.data) {
					const program = plainToInstance(ProgramDto, response.data);
					this.programStore.setProgram(program);
				}
			}),
			map((response) => plainToInstance(ProgramDto, response.data?.promoter) ?? new ProgramDto()),
			catchError((error) => {
				this.snackBarService.openSnackBar('Failed to get program', '');
				this.programStore.setStatus(Status.ERROR, error);

				this.router.navigate(['/404']);
				return of(new ProgramDto());
			})
		)
	}

}
