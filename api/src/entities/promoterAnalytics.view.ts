import { promoterAnalyticsMVName, referralMVName } from "src/constants";
import { Column, DataSource, Index, PrimaryColumn, ViewEntity } from "typeorm";
import { ReferralView } from "./referral.view";

@ViewEntity({
	name: promoterAnalyticsMVName,
	expression: (datasource: DataSource) => {
		const referralAgg = datasource
			.createQueryBuilder()
			.select('rv.program_id', 'program_id')
			.addSelect('rv.promoter_id', 'promoter_id')
			.addSelect('SUM(rv.total_revenue)', 'total_revenue')
			.addSelect('SUM(rv.total_commission)', 'total_commission')
			.from(referralMVName, 'rv')
			.groupBy('rv.program_id, rv.promoter_id');

		const signUpAgg = datasource
			.createQueryBuilder()
			.select('c.program_id', 'program_id')
			.addSelect('s.promoter_id', 'promoter_id')
			.addSelect('COUNT(DISTINCT s.contact_id)', 'total_signups')
			.from('sign_up', 's')
			.innerJoin('contact', 'c', 's.contact_id = c.contact_id')
			.groupBy('c.program_id, s.promoter_id');

		const purchaseAgg = datasource
			.createQueryBuilder()
			.select('c.program_id', 'program_id')
			.addSelect('p.promoter_id', 'promoter_id')
			.addSelect('COUNT(DISTINCT p.purchase_id)', 'total_purchases')
			.from('purchase', 'p')
			.innerJoin('contact', 'c', 'p.contact_id = c.contact_id')
			.groupBy('c.program_id, p.promoter_id');
 
		return datasource
			.createQueryBuilder()
			.from('program_promoter', 'pp')
			.select('pp.program_id', 'program_id')
			.addSelect('pp.promoter_id', 'promoter_id')
			.addSelect('COALESCE(rv.total_revenue, 0)', 'total_revenue')
			.addSelect('COALESCE(rv.total_commission, 0)', 'total_commission')
			.addSelect('COALESCE(su.total_signups, 0)', 'total_signups')
			.addSelect('COALESCE(pu.total_purchases, 0)', 'total_purchases')
			.leftJoin(`(${referralAgg.getQuery()})`, 'rv', 'rv.program_id = pp.program_id AND rv.promoter_id = pp.promoter_id')
			.leftJoin(`(${signUpAgg.getQuery()})`, 'su', 'su.program_id = pp.program_id AND su.promoter_id = pp.promoter_id')
			.leftJoin(`(${purchaseAgg.getQuery()})`, 'pu', 'pu.program_id = pp.program_id AND pu.promoter_id = pp.promoter_id');
	},
	materialized: true,
	dependsOn: [ReferralView],
})
export class PromoterAnalyticsView {
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

	@Column('int', { name: 'total_signups' })
	totalSignUps: number;

	@Column('int', { name: 'total_purchases' })
	totalPurchases: number;
}