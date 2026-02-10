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

    @Column({ type: 'numeric', default: 0, name: 'revenue', transformer: NumericToNumber })
    dailyRevenue: number;

    @Column({ type: 'numeric', default: 0, name: 'commission', transformer: NumericToNumber })
    dailyCommission: number;

    @Column({ type: 'numeric', nullable: true, name: 'signup_commission', transformer: NumericToNumber })
    signupCommission: number;

    @Column({ type: 'numeric', nullable: true, name: 'purchase_commission', transformer: NumericToNumber })
    purchaseCommission: number;

    @Column({ type: 'numeric', default: 0, name: 'signups', transformer: NumericToNumber })
    dailySignups: number;

    @Column({ type: 'numeric', default: 0, name: 'purchases', transformer: NumericToNumber })
    dailyPurchases: number;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
    updatedAt: Date;
}
