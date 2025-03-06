import { triggerEnum } from "../enums";

export class TriggerEvent {

    constructor(
        public triggerType: triggerEnum,
        public contactId: string,
        public promoterId: string,
        public programId: string,
        public externalId?: string,
        public itemId?: string,
        public amount?: number,
    ) { }

}

export const TRIGGER_EVENT = 'trigger_event';