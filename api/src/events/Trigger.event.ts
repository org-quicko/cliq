import { TriggerEventData } from '../interfaces/eventData.interface';
import { BaseEvent } from '../events';

export class TriggerEvent extends BaseEvent {
	constructor(
		public programId: string,
		public source: string,
		public type: string,
		public data: TriggerEventData,
		public subject?: string,
	) {
		super(
			programId,
			source,
			type,
			data,
			subject,
		);
	}
}

