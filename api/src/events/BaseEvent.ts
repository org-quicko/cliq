import { Expose } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseEvent {

    @Expose({ name: 'id' })
    public id: string;

    @Expose({ name: 'time' })
    public time: Date;

    @Expose({ name: 'specversion' })
    public specversion: string = '1.0';

    @Expose({ name: 'datacontenttype' })
    public datacontenttype: string = 'application/json';
    
    @Expose({ name: 'program_id' })
    public programId: string;
    
    @Expose({ name: 'source' })
    public source: string;
    
    @Expose({ name: 'type' })
    public type: string;
    
    @Expose({ name: 'data' })
    public data: object;
    
    @Expose({ name: 'subject' })
    public subject?: string;

    constructor(
        programId: string,
        source: string,
        type: string,
        data: object,
        subject?: string,
    ) {
        this.id = uuidv4();
        this.time = new Date();
        this.programId = programId;
        this.source = source;
        this.type = type;
        this.data = data;
        this.subject = subject;

    }

}