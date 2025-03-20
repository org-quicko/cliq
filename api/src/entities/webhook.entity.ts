import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { Program } from './program.entity';
import * as bcrypt from 'bcrypt';

@Entity('webhook')
export class Webhook {
    @PrimaryGeneratedColumn('uuid', { name: 'webhook_id' })
    webhookId: string;

    @Column('varchar')
    url: string;

    @ManyToOne(() => Program, (program) => program.webhooks, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'program_id',
        referencedColumnName: 'programId',
    })
    program: Program;

    @Column('uuid', { name: 'program_id' })
    programId: string;

    @Column('varchar')
    secret: string;

    // Array of event types this webhook is subscribed to,
    // for example: ['commission.created']
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
