import { RouterState } from "@angular/router"
import { MemberReducer } from "./member-store/member-store.reducer";
import { MemberStoreModel } from "./member-store/member-store.model";

export enum AppStatus {
    PENDING = 'pending',
    ERROR = 'error',
    SUCCESS = 'success',
    LOADING = 'loading',
}

export const enum RootKeys {
    router = 'router',
    member_store = 'member_store',
}

export interface AppModel {
	[RootKeys.router]: RouterState;
	[RootKeys.member_store]: MemberStoreModel;
}

export const RootReducers = {
	[RootKeys.member_store]: MemberReducer
}
