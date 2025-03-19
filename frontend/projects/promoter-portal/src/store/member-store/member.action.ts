import { v4 as uuidv4 } from "uuid";
import { createAction, props } from "@ngrx/store";
import { MemberDto } from "../../../../org-quicko-cliq-core/src/lib/dtos/member.dto";
import { Status } from "../../../../org-quicko-cliq-core/src/lib/enums/stateStatus.enum";


export const MemberActions = {
    SIGN_IN_MEMBER: createAction('[Member] GET sign in member'),

    SIGN_IN_MEMBER_SUCCESS: createAction(
        '[Member] GET sign in member SUCCESS',
        props<{ member: MemberDto }>()
    ),

    SIGN_IN_MEMBER_FAILURE: createAction(
        '[Member] GET sign in member FAILURE',
        props<{ error: string, status: Status }>()
    ),

    GET_MEMBER: createAction('[Member] GET Member ' + uuidv4()),

    GET_MEMBER_SUCCESS: createAction('[Member] GET Member Success ' + uuidv4(), props<{ member: MemberDto }>()),

    GET_MEMBER_ERROR: createAction('[Member] GET Member Error ' + uuidv4(), props<{ err: any }>()),
};
