import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { NumericToNumber } from 'src/utils/numericToNumber.util';

@Entity('link_analytics_day_wise_mv')
export class LinkAnalyticsDayWiseView {
    @PrimaryColumn({ type: 'date', name: 'date' })
    date: Date;

    @PrimaryColumn({ type: 'uuid', name: 'link_id' })
    linkId: string;

    @Column({ type: 'varchar', name: 'name' })
    name: string;

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
        name: 'daily_signups',
        default: 0,
        transformer: NumericToNumber 
    })
    dailySignups: number;

    @Column({ 
        type: 'numeric', 
        name: 'daily_purchases',
        default: 0,
        transformer: NumericToNumber 
    })
    dailyPurchases: number;

    @Column({ 
        type: 'numeric', 
        name: 'daily_commission',
        default: 0,
        transformer: NumericToNumber 
    })
    dailyCommission: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
