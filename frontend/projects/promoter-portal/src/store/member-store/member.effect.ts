import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap, map, catchError } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { SnackbarService } from '../../../../org-quicko-cliq-core/src/lib/services/snackbar.service';
import { MemberActions } from './member.action';
import { MemberService } from '../../services/member.service';

@Injectable()
export class MemberEffects {
	constructor(
		private actions: Actions,
		private memberService: MemberService,
		private snackBarService: SnackbarService,
		private store: Store
	) { }


	getMember$ = createEffect(() =>
		this.actions.pipe(
			ofType(MemberActions.GET_MEMBER),
			switchMap((action) => {
				return this.memberService.getMember().pipe(
					map((response) => {
						return MemberActions.GET_MEMBER_SUCCESS({ member: response.data! });
					}),
					catchError((err, caught) => {
						if (err.error.code != 521) {
							this.snackBarService.openSnackBar('Fail to get member', "");
						}
						this.store.dispatch(MemberActions.GET_MEMBER_ERROR({ err: err }));
						throw err;
					})
				)
			}
			)
		)
	);
}
