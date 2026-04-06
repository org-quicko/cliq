import { SignUpCreatedEventData } from "../interfaces/eventData.interface";
import { TriggerEvent } from "./Trigger.event";

export class SignUpCreatedEvent extends TriggerEvent {
    
    constructor(
        public programId: string,
        public promoterId: string,
        public source: string,
        public data: SignUpCreatedEventData,
    ) {
        super(
            programId,
            promoterId,
            source,
            SIGNUP_CREATED,
            data,
            data['signup_id']
        );
    }
}

export const SIGNUP_CREATED = 'in.org.quicko.cliq.signup.created';
