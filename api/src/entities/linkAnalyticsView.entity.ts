import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { NumericToNumber } from 'src/utils/numericToNumber.util';

@Entity('link_analytics_mv')
export class LinkAnalyticsView {
    @PrimaryColumn({ type: 'uuid', name: 'link_id' })
    linkId: string;

    @Column({ type: 'varchar', name: 'name' })
    name: string;

    @Index()
    @Column({ type: 'varchar', name: 'ref_val' })
    refVal: string;

    @Index()
    @Column({ type: 'uuid', name: 'program_id' })
    programId: string;

    @Index()
    @Column({ type: 'uuid', name: 'promoter_id' })
    promoterId: string;

    @Column({ 
        type: 'numeric', 
        default: 0,
        transformer: NumericToNumber 
    })
    signups: number;

    @Column({ 
        type: 'numeric', 
        default: 0,
        transformer: NumericToNumber 
    })
    purchases: number;

    @Column({ 
        type: 'numeric', 
        default: 0,
        transformer: NumericToNumber 
    })
    commission: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
