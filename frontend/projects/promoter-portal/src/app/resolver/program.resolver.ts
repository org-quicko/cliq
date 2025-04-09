import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { catchError, firstValueFrom, map, Observable, of, tap } from 'rxjs';
import { ProgramDto as Program, ProgramDto } from '../../../../org-quicko-cliq-core/src/lib/dtos';
import { ProgramService } from '../services/program.service';
import { ProgramStore } from '../store/program.store';
import { Status } from '../../../../org-quicko-cliq-core/src/lib/enums/stateStatus.enum';
import { plainToInstance } from 'class-transformer';
import { tapResponse } from '@ngrx/operators';
import { SnackbarService } from '@org.quicko/ngx-core';


@Injectable({ providedIn: 'root' })
export class ProgramResolver implements Resolve<Program> {
	constructor() { }

	readonly programStore = inject(ProgramStore);

	readonly programService = inject(ProgramService);
	readonly snackBarService = inject(SnackbarService);

	resolve(route: ActivatedRouteSnapshot): Observable<ProgramDto> {
		const programId = route.paramMap.get('program_id'); // Get program_id from route
		if (!programId) {
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
				return of(new ProgramDto());
			})
		)
	}

}
