import { createReducer, on } from "@ngrx/store";
import { MemberActions } from "./member.action";
import { initialMemberState, MemberStoreModel } from "./member-store.model";
import { Status } from "../../../../org-quicko-cliq-core/src/lib/enums/stateStatus.enum";

const onGetUser = on(
    MemberActions.GET_MEMBER,
    (state: MemberStoreModel) => {
        return {
            ...state,
            status: Status.LOADING
        };
    }
);

const onGetUserSuccess = on(
    MemberActions.GET_MEMBER_SUCCESS,
    (state: MemberStoreModel, { member }) => {
        return {
            ...state,
            member: member
        };
    }
);

const onGetUserFailure = on(
    MemberActions.GET_MEMBER_ERROR,
    (state: MemberStoreModel, { err }) => {
        return {
            ...state,
            error: err
        }
    }
);

export const MemberReducer = createReducer(
    initialMemberState,
    onGetUser,
    onGetUserSuccess,
    onGetUserFailure
);
