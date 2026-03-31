import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    UpdateDateColumn, 
    ManyToOne, 
    JoinColumn, 
    Unique 
} from 'typeorm';
import { Program } from './program.entity';
import { Promoter } from './promoter.entity';

@Entity('promoter_webhook')
export class PromoterWebhook {
    @PrimaryGeneratedColumn('uuid', { name: 'webhook_id' })
    webhookId: string;

    @Column('varchar')
    url: string;

    @ManyToOne(() => Program, (program) => program.promoterWebhooks, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'program_id',
        referencedColumnName: 'programId',
    })
    program: Program;

    @Column('uuid', { name: 'program_id' })
    programId: string;

    @ManyToOne(() => Promoter, (promoter) => promoter.promoterWebhooks, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'promoter_id',
        referencedColumnName: 'promoterId',
    })
    promoter: Promoter;

    @Column('uuid', { name: 'promoter_id' })
    promoterId: string;

    @Column('varchar')
    secret: string;

    // Array of event types this webhook is subscribed to
    // for example: ['offer.created', 'participant.updated']
    @Column('varchar', { array: true })
    events: string[];

    @CreateDateColumn({
        type: 'timestamp with time zone',
        default: () => `now()`,
        name: 'created_at',
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: 'timestamp with time zone',
        default: () => `now()`,
        name: 'updated_at',
    })
    updatedAt: Date;
}