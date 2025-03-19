import { signalStore, withState } from '@ngrx/signals';
import { MemberDto } from '../../../../../../org-quicko-cliq-core/src/lib/dtos/member.dto';

export interface LogInState {
	member: MemberDto | null;
}

const initialLogInState: LogInState = {
	member: null,
};

export const LogInStore = signalStore(
	withState(initialLogInState)
);

