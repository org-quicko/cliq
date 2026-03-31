import { ContactCreatedEventData } from "../interfaces/eventData.interface";
import { BaseEvent } from "./BaseEvent";

export class ContactCreatedEvent extends BaseEvent {
    
    constructor(
        public programId: string,
        public source: string,
        public data: ContactCreatedEventData,
        public contactId?: string,
    ) {
        super(
            programId,
            source,
            CONTACT_CREATED,
            data,
            contactId
        );
    }
}

export const CONTACT_CREATED = 'org.quicko.cliq.contact.created';
