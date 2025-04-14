import { TriggerEventData } from 'src/interfaces/eventData.interface';
import { BaseEvent } from './BaseEvent';

export abstract class TriggerEvent extends BaseEvent {
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

