import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ProgramDto as Program, ProgramDto } from '../../../../org-quicko-cliq-core/src/lib/dtos';
import { ProgramService } from '../services/program.service';
import { ProgramStore } from '../store/program.store';
import { Status } from '../../../../org-quicko-cliq-core/src/lib/enums/stateStatus.enum';
import { plainToInstance } from 'class-transformer';
import { tapResponse } from '@ngrx/operators';


@Injectable({ providedIn: 'root' })
export class ProgramResolver implements Resolve<Program> {
	constructor() { }

	readonly store = inject(ProgramStore);

	readonly programService = inject(ProgramService);

	async resolve(route: ActivatedRouteSnapshot) {
		const programId = route.paramMap.get('program_id'); // Get program_id from route
		if (!programId) {
			throw new Error('Program ID is missing in route');
		}

		this.store.setStatus(Status.LOADING);

		const response = await firstValueFrom(this.programService.getProgram(programId));
		// this.programService.getProgram(programId).pipe(
		// 	tapResponse({
		// 		next: ()
		// 	})
		// )

		if (!response.data) {
			this.store.setStatus(Status.ERROR);
			throw new Error('Program not found');
		}

		this.store.setProgram(plainToInstance(ProgramDto, response.data)); // set the global store
		return response.data;
	}

}
