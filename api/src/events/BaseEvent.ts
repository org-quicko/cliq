import { v4 as uuidv4 } from 'uuid';

export abstract class BaseEvent {

    public id: string;

    public time: Date;
    
    public specVersion: string = '1.0';

    public datacontenttype: string = 'application/json';

    constructor(
        public programId: string,
        public source: string,
        public type: string,   
        public data: object,
        public subject?: string,
    ) {
        this.id = uuidv4();
        this.time = new Date();
    }
    
}