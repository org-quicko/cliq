import { MemberDto } from "../../../../org-quicko-cliq-core/src/lib/dtos/member.dto";
import { Status } from "../../../../org-quicko-cliq-core/src/lib/enums/stateStatus.enum";

export interface MemberStoreModel {
    member: MemberDto | null,
    error: any | null,
    status: Status
}

export const initialMemberState: MemberStoreModel = {
    member: null,
    error: null,
    status: Status.PENDING
};
