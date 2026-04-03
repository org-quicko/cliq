import { PurchaseCreatedEventData } from "../interfaces/eventData.interface";
import { TriggerEvent } from "./Trigger.event";

export class PurchaseCreatedEvent extends TriggerEvent {
	constructor(
		public programId: string,
		public promoterId: string,
		public source: string,
		public data: PurchaseCreatedEventData,
		public purchaseId?: string,
	) {
		super(
			programId,
			promoterId,
			source,
			PURCHASE_CREATED,
			data,
			purchaseId,
		);
	}
}

export const PURCHASE_CREATED = 'in.org.quicko.cliq.purchase.created';