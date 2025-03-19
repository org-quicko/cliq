import { PurchaseCreatedEventData, SignUpCreatedEventData, TriggerEventData } from 'src/interfaces/eventData.interface';
import { BaseEvent } from './BaseEvent';

export abstract class TriggerEvent extends BaseEvent {
	constructor(
		public source: string,
		public type: string,
		public data: TriggerEventData,
		public subject?: string,
	) {
		super(
			source,
			type,
			data,
			subject,
		);
	}
}

export class SignUpCreatedEvent extends TriggerEvent {
	
	constructor(
		public source: string,
		public data: SignUpCreatedEventData,
		public signUpId?: string,
	) {
		super(
			source,
			SIGNUP_CREATED,
			data,
			signUpId
		);
	}

}

export class PurchaseCreatedEvent extends TriggerEvent {
	constructor(
		public source: string,
		public data: PurchaseCreatedEventData,
		public purchaseId?: string,
	) {
		super(
			source,
			PURCHASE_CREATED,
			data,
			purchaseId,
		);
	}
}

export const SIGNUP_CREATED = 'signup.created';
export const PURCHASE_CREATED = 'purchase.created';
