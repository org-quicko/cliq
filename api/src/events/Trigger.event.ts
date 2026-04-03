import { TriggerEventData } from '../interfaces/eventData.interface';
import { BaseEvent } from './BaseEvent';

export class TriggerEvent extends BaseEvent {
	constructor(
		public programId: string,
		public promoterId: string | undefined,
		public source: string,
		public type: string,
		public data: TriggerEventData,
		public subject?: string,
	) {
		super(
			programId,
			promoterId,
			source,
			type,
			data,
			subject,
		);
	}
}

