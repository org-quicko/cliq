import { CommissionCreatedEventData } from "../interfaces/eventData.interface";
import { BaseEvent } from "./BaseEvent";

export class CommissionCreatedEvent extends BaseEvent {
    
    constructor(
        public programId: string,
        public promoterId: string,
        public source: string,
        public data: CommissionCreatedEventData,
    ) {
        super(
            programId,
            promoterId,
            source,
            COMMISSION_CREATED,
            data,
            data['commission_id']
        );
    }
}

export const COMMISSION_CREATED = 'in.org.quicko.cliq.commission.created';
