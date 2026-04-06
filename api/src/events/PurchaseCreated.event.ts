import { PurchaseCreatedEventData } from "../interfaces/eventData.interface";
import { TriggerEvent } from "./Trigger.event";

export class PurchaseCreatedEvent extends TriggerEvent {
	constructor(
		public programId: string,
		public promoterId: string,
		public source: string,
		public data: PurchaseCreatedEventData,
	) {
		super(
			programId,
			promoterId,
			source,
			PURCHASE_CREATED,
			data,
			data['purchase_id']
		);
	}
}

export const PURCHASE_CREATED = 'in.org.quicko.cliq.purchase.created';