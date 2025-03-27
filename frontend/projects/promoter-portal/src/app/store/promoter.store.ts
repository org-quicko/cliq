import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { PromoterDto as Promoter, Status } from "@org.quicko.cliq/ngx-core";

export interface PromoterStoreState {
	promoter: Promoter | null,
	error: any | null,
	status: Status
};

export const initialPromoterState: PromoterStoreState = {
	promoter: null,
	error: null,
	status: Status.PENDING
};

export const PromoterStore = signalStore(
	{ providedIn: 'root' },

	withState(initialPromoterState),

	withMethods(
		(store) => ({
		setPromoter: (promoter: Promoter) => {
			patchState(store, { promoter, status: Status.SUCCESS });
		},

		setStatus: (status: Status) => {
			patchState(store, { status });
		},
	})),
);
