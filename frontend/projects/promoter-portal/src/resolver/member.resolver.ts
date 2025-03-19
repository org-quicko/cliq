import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { MemberActions } from '../store/member-store/member.action';
import { getMember } from '../store/member-store/member-store.selector';
import { MemberDto as Member } from '../../../org-quicko-cliq-core/src/lib/dtos/member.dto';

@Injectable({ providedIn: 'root' })
export class MemberResolver implements Resolve<Member> {
    constructor(
        private store: Store,
        private actions$: Actions
    ) { }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Member> {
        this.store.dispatch(MemberActions.GET_MEMBER());

        return this.actions$.pipe(
            ofType(MemberActions.GET_MEMBER_SUCCESS),
            switchMap(() => this.store.select(getMember()).pipe(
                map((member: Member | null) => {
                    if (member === null) {
                        throw new Error('Member not found');
                    }
                    return member;
                })
            ))
        );
    }
}
