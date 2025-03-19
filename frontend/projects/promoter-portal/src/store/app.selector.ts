import { createFeatureSelector } from "@ngrx/store";
import { MemberStoreModel } from "./member-store/member-store.model";
import { RootKeys } from "./app.model";

export const RootSelectors = {
	MEMBER: createFeatureSelector<MemberStoreModel>(RootKeys.member_store),
};
