import { linkAnalyticsMVName } from 'src/constants';
import { linkStatusEnum } from 'src/enums';
import { NumericToNumber } from 'src/utils/numericToNumber.util';
import { ViewEntity, DataSource, SelectQueryBuilder, ViewColumn, Index } from 'typeorm';

@ViewEntity({
    name: linkAnalyticsMVName,
    materialized: true,
    expression: (dataSource: DataSource): SelectQueryBuilder<any> => {
        return dataSource
            .createQueryBuilder()
            .select('l.link_id', 'link_id')
            .addSelect('l.name', 'name')
            .addSelect('l.ref_val', 'ref_val')
            .addSelect('l.program_id', 'program_id')
            .addSelect('l.promoter_id', 'promoter_id')
            .addSelect('COALESCE(s.signups, 0)', 'signups')
            .addSelect('COALESCE(p.purchases, 0)', 'purchases')
            .addSelect('COALESCE(c.total_commission, 0)', 'commission')
            .addSelect('l.created_at', 'created_at')
            .from('link', 'l')
            .where(`l.status = '${linkStatusEnum.ACTIVE}'`) // Filter for active links
            .leftJoin(
                (qb) =>
                    qb
                        .select('s.link_id', 'link_id')
                        .addSelect('COUNT(s.contact_id)', 'signups')
                        .from('sign_up', 's')
                        .groupBy('s.link_id'),
                's',
                's.link_id = l.link_id',
            )
            .leftJoin(
                (qb) =>
                    qb
                        .select('pu.link_id', 'link_id')
                        .addSelect('COUNT(pu.purchase_id)', 'purchases')
                        .from('purchase', 'pu')
                        .groupBy('pu.link_id'),
                'p',
                'p.link_id = l.link_id',
            )
            .leftJoin(
                (qb) =>
                    qb
                        .select('com.link_id', 'link_id')
                        .addSelect('SUM(com.amount)', 'total_commission')
                        .from('commission', 'com')
                        .groupBy('com.link_id'),
                'c',
                'c.link_id = l.link_id',
            );
    }

})
export class LinkAnalyticsView {
    @ViewColumn({ name: 'link_id' })
    linkId: string;

    @ViewColumn({ name: 'name' })
    name: string;

    @Index()
    @ViewColumn({ name: 'ref_val' })
    refVal: string;

    @Index()
    @ViewColumn({ name: 'promoter_id' })
    promoterId: string;

    @Index()
    @ViewColumn({ name: 'program_id' })
    programId: string;

    @ViewColumn({ transformer: NumericToNumber })
    signups: number;

    @ViewColumn({ transformer: NumericToNumber })
    purchases: number;

    @ViewColumn({ transformer: NumericToNumber })
    commission: number;

    @ViewColumn({ name: 'created_at' })
    createdAt: Date;
}
