import { triggerEnum } from '../enums';

export class TriggerEvent {
	constructor(
		public triggerType: triggerEnum,
		public contactId: string,
		public promoterId: string,
		public programId: string,
		public externalId?: string,
		public itemId?: string,
		public amount?: number,
	) {}
}

export class SignUpEvent extends TriggerEvent {
	constructor(
		public contactId: string,
		public promoterId: string,
		public programId: string,
		public externalId?: string,
	) {
		super(triggerEnum.SIGNUP, contactId, promoterId, programId, externalId);
	}
}

export class PurchaseEvent extends TriggerEvent {
	constructor(
		public contactId: string,
		public promoterId: string,
		public programId: string,
		public itemId: string,
		public amount: number,
		public externalId?: string,
	) {
		super(
			triggerEnum.PURCHASE,
			contactId,
			promoterId,
			programId,
			externalId,
			itemId,
			amount,
		);
	}
}

export const TRIGGER_EVENT = 'trigger_event';
export const SIGNUP_EVENT = 'signup_event';
export const PURCHASE_EVENT = 'purchase_event';
