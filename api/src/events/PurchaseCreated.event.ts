import { PurchaseCreatedEventData } from "../interfaces/eventData.interface";
import { TriggerEvent } from "./Trigger.event";

export class PurchaseCreatedEvent extends TriggerEvent {
	constructor(
		public programId: string,
		public source: string,
		public data: PurchaseCreatedEventData,
		public purchaseId?: string,
	) {
		super(
			programId,
			source,
			PURCHASE_CREATED,
			data,
			purchaseId,
		);
	}
}

export const PURCHASE_CREATED = 'org.quicko.cliq.purchase.created';