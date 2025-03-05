export class SwitchCircleEvent {

    constructor(
        public programId: string,
        public promoterId: string,
        public currentCircleId: string,
        public targetCircleId: string,
    ) { }

}

export const SWITCH_CIRCLE_EVENT = 'switch_circle_event';