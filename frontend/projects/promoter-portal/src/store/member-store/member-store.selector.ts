import { createSelector } from "@ngrx/store";
import { RootSelectors } from "../app.selector";
import { MemberStoreModel } from "./member-store.model";

const MemberSelector = createSelector(
	RootSelectors.MEMBER,
	(state: MemberStoreModel) => state
);

export const getMember = () => createSelector(
	MemberSelector,
	(state: MemberStoreModel) => state.member!
);
