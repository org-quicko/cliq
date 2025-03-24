import { linkStatsMVName } from 'src/constants';
import { ViewEntity, DataSource, SelectQueryBuilder, ViewColumn, Index } from 'typeorm';

@ViewEntity({
    name: linkStatsMVName,
    materialized: true,
    expression: (dataSource: DataSource): SelectQueryBuilder<any> => {
        return dataSource
            .createQueryBuilder()
            .select('l.link_id', 'link_id')
            .select('l.name', 'name')
            .addSelect('l.ref_val', 'ref_val')
            .addSelect('l.program_id', 'program_id')
            .addSelect('l.promoter_id', 'promoter_id')
            .addSelect('COALESCE(s.signups, 0)', 'signups')
            .addSelect('COALESCE(p.purchases, 0)', 'purchases')
            .addSelect('COALESCE(c.total_commission, 0)', 'commission')
            .addSelect('l.created_at', 'created_at')
            .from('link', 'l')
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
            )
    }
})
export class LinkStatsView {
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

    @ViewColumn()
    signups: number;

    @ViewColumn()
    purchases: number;

    @ViewColumn()
    commission: number;

    @ViewColumn({ name: 'created_at' })
    createdAt: Date;
}
