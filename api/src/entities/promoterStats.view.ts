import { promoterStatsMVName, referralMVName } from "src/constants";
import { Column, DataSource, Index, PrimaryColumn, ViewEntity } from "typeorm";
import { ReferralView } from "./referral.view";

@ViewEntity({
    name: promoterStatsMVName,
    expression: (datasource: DataSource) => {
        return datasource
            .createQueryBuilder()
            .from(referralMVName, 'rv')
            .select('rv.program_id', 'program_id')
            .addSelect('rv.promoter_id', 'promoter_id')
            .addSelect('SUM(rv.total_revenue)', 'total_revenue')
            .addSelect('SUM(rv.total_commission)', 'total_commission')
            .addSelect(
                `(SELECT COUNT(*) FROM sign_up s 
      JOIN contact c ON s.contact_id = c.contact_id 
      WHERE c.program_id = rv.program_id AND s.promoter_id = rv.promoter_id)`,
                'total_signups'
            )
            .addSelect(
                `(SELECT COUNT(*) FROM purchase p 
      JOIN contact c ON p.contact_id = c.contact_id 
      WHERE c.program_id = rv.program_id AND p.promoter_id = rv.promoter_id)`,
                'total_purchases'
            )
            .groupBy('rv.program_id, rv.promoter_id');

    },
    dependsOn: [ReferralView],
    materialized: true,
})
export class PromoterStatsView {
    @Index()
    @PrimaryColumn('uuid', { name: 'program_id' })
    programId: string;

    @Index()
    @PrimaryColumn('uuid', { name: 'promoter_id' })
    promoterId: string;

    @Column('decimal', { name: 'total_revenue' })
    totalRevenue: number;

    @Column('decimal', { name: 'total_commission' })
    totalCommission: number;

    @Column('decimal', { name: 'total_signups' })
    totalSignUps: number;

    @Column('decimal', { name: 'total_purchases' })
    totalPurchases: number;
}