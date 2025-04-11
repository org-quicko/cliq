import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { catchError, firstValueFrom, map, Observable, of, tap } from 'rxjs';
import { MemberDto as Member, MemberDto } from '../../../../org-quicko-cliq-core/src/lib/dtos/member.dto';
import { MemberStore } from '../store/member.store';
import { MemberService } from '../services/member.service';
import { plainToInstance } from 'class-transformer';
import { SnackbarService } from '@org.quicko/ngx-core';
import { PermissionsService } from '../services/permission.service';
import { Status } from '@org.quicko.cliq/ngx-core';
import { ProgramStore } from '../store/program.store';

@Injectable({ providedIn: 'root' })
export class MemberResolver implements Resolve<Member> {
	constructor() { }

	readonly memberStore = inject(MemberStore);
	readonly programStore = inject(ProgramStore);
	readonly memberService = inject(MemberService);
	readonly snackBarService = inject(SnackbarService);
	readonly permissionService = inject(PermissionsService);

	resolve(): Observable<MemberDto> {
		const programId = this.programStore.program()!.programId;

		return this.memberService.getMember(programId).pipe(
			tap((response) => {
				if (response.data) {
					const member = plainToInstance(MemberDto, response.data);
					this.memberStore.setMember(member);

					const role = member.role;
					if (role) {
						this.permissionService.setAbilityForRole(role);
					}
				}
			}),
			map((response) => plainToInstance(MemberDto, response.data) ?? new MemberDto()),
			catchError((error) => {
				this.snackBarService.openSnackBar('Failed to get member', '');
				console.error(error);
				this.memberStore.setStatus(Status.ERROR, error);
				return of(new MemberDto());
			})
		);
	}
}
