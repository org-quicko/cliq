import { SignUpCreatedEventData } from "../interfaces/eventData.interface";
import { TriggerEvent } from "./Trigger.event";

export class SignUpCreatedEvent extends TriggerEvent {
    
    constructor(
        public programId: string,
        public source: string,
        public data: SignUpCreatedEventData,
        public signUpId?: string,
    ) {
        super(
            programId,
            source,
            SIGNUP_CREATED,
            data,
            signUpId
        );
    }
}

export const SIGNUP_CREATED = 'org.quicko.cliq.signup.created';
