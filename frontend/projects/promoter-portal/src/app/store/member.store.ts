import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { MemberDto as Member, Status } from '@org.quicko.cliq/ngx-core';
import { MemberService } from '../services/member.service';
import { withDevtools } from '@angular-architects/ngrx-toolkit';

export interface MemberStoreState {
	member: Member | null,
	error: any | null,
	status: Status
};

export const initialMemberState: MemberStoreState = {
	member: null,
	error: null,
	status: Status.PENDING
};

export const MemberStore = signalStore(
	{ providedIn: 'root' },
	withDevtools('member'),

	withState(initialMemberState),
	withMethods((store, memberService = inject(MemberService)) => ({

		setMember: (member: Member) => {
			patchState(store, { member, status: Status.SUCCESS });
		}

	}))
);
