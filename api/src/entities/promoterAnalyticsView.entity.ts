import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { NumericToNumber } from 'src/utils/numericToNumber.util';

@Entity('promoter_analytics_mv')
export class PromoterAnalyticsView {
    @PrimaryColumn('uuid', { name: 'promoter_id' })
    promoterId: string;

    @PrimaryColumn('uuid', { name: 'program_id' })
    programId: string;

    @Column({ type: 'numeric', default: 0, name: 'total_revenue', transformer: NumericToNumber })
    totalRevenue: number;

    @Column({ type: 'numeric', default: 0, name: 'total_commission', transformer: NumericToNumber })
    totalCommission: number;

    @Column({ type: 'numeric', nullable: true, name: 'commission_through_signups', transformer: NumericToNumber })
    commissionThroughSignups?: number;

    @Column({ type: 'numeric', nullable: true, name: 'commission_through_purchases', transformer: NumericToNumber })
    commissionThroughPurchases?: number;

    @Column({ type: 'numeric', default: 0, name: 'total_signups', transformer: NumericToNumber })
    totalSignUps: number;

    @Column({ type: 'numeric', default: 0, name: 'total_purchases', transformer: NumericToNumber })
    totalPurchases: number;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
    updatedAt: Date;
}
