import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { MemberDto } from '../../../../../../org-quicko-cliq-core/src/lib/dtos/member.dto';
import { MemberService } from '../../../services/member.service';
import { EventEmitter, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { firstValueFrom } from 'rxjs';

export interface SignUpState {
	member: MemberDto | null;
}

const initialSignUpState: SignUpState = {
	member: null,
};

export const onSignUpSuccess: EventEmitter<boolean> = new EventEmitter();
export const onSignUpError: EventEmitter<string> = new EventEmitter()

export const SignUpStore = signalStore(
	withState(initialSignUpState),

	withMethods(
		(
			store,
			memberService = inject(MemberService),
			authService = inject(AuthService),
		) => ({

			signUp: async (member: MemberDto) => {
				try {
					const response = await firstValueFrom(memberService.signUp(member));
					authService.setToken(response.data!.access_token);

					onSignUpSuccess.emit(true);
				} catch (error) {
					if (error instanceof Error) {
						onSignUpError.emit(error.message || 'Signup failed');
					}
				}
			},

		})),
);

