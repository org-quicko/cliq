import { ContactCreatedEventData } from "../interfaces/eventData.interface";
import { BaseEvent } from "./BaseEvent";

export class ContactCreatedEvent extends BaseEvent {
    
    constructor(
        public programId: string,
        public promoterId: string | undefined,
        public source: string,
        public data: ContactCreatedEventData,
        public contactId?: string,
    ) {
        super(
            programId,
            promoterId,
            source,
            CONTACT_CREATED,
            data,
            contactId
        );
    }
}

export const CONTACT_CREATED = 'in.org.quicko.cliq.contact.created';
