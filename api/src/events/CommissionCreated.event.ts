import { CommissionCreatedEventData } from "../interfaces/eventData.interface";
import { BaseEvent } from "./BaseEvent";

export class CommissionCreatedEvent extends BaseEvent {
    
    constructor(
        public programId: string,
        public source: string,
        public data: CommissionCreatedEventData,
        commissionId?: string,
    ) {
        super(
            programId,
            source,
            COMMISSION_CREATED,
            data,
            commissionId
        );
    }
}

export const COMMISSION_CREATED = 'org.quicko.cliq.commission.created';
