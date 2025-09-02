import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { NumericToNumber } from 'src/utils/numericToNumber.util';

@Entity('promoter_analytics_day_wise_mv')
export class PromoterAnalyticsDayWiseView {
    @PrimaryColumn('date', { name: 'date' })
    date: Date;

    @PrimaryColumn('uuid', { name: 'promoter_id' })
    promoterId: string;

    @PrimaryColumn('uuid', { name: 'program_id' })
    programId: string;

    @Column({ type: 'numeric', default: 0, name: 'daily_revenue', transformer: NumericToNumber })
    dailyRevenue: number;

    @Column({ type: 'numeric', default: 0, name: 'daily_commission', transformer: NumericToNumber })
    dailyCommission: number;

    @Column({ type: 'numeric', default: 0, name: 'daily_signups', transformer: NumericToNumber })
    dailySignups: number;

    @Column({ type: 'numeric', default: 0, name: 'daily_purchases', transformer: NumericToNumber })
    dailyPurchases: number;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
    updatedAt: Date;
}
