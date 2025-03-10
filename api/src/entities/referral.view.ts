import {
	ViewEntity,
	DataSource,
	SelectQueryBuilder,
	Column,
	PrimaryColumn,
	Index,
} from 'typeorm';

@ViewEntity({
	name: 'referral_mv',
	expression: (datasource: DataSource): SelectQueryBuilder<any> => {
		const revenueSubquery = datasource
			.createQueryBuilder()
			.select('c.program_id', 'program_id')
			.addSelect('pu.promoter_id', 'promoter_id')
			.addSelect('c.contact_id', 'contact_id')
			.addSelect('SUM(pu.amount)', 'total_revenue')
			.addSelect('0', 'total_commission')
			.from('contact', 'c')
			.innerJoin('purchase', 'pu', 'pu.contact_id = c.contact_id')
			.groupBy('c.program_id')
			.addGroupBy('pu.promoter_id')
			.addGroupBy('c.contact_id');

		const commissionSubquery = datasource
			.createQueryBuilder()
			.select('c.program_id', 'program_id')
			.addSelect('com.promoter_id', 'promoter_id')
			.addSelect('c.contact_id', 'contact_id')
			.addSelect('0', 'total_revenue')
			.addSelect('SUM(com.amount)', 'total_commission')
			.from('contact', 'c')
			.innerJoin('commission', 'com', 'com.contact_id = c.contact_id')
			.groupBy('c.program_id')
			.addGroupBy('com.promoter_id')
			.addGroupBy('c.contact_id');

		const signupSubquery = datasource
			.createQueryBuilder()
			.select('c.program_id', 'program_id')
			.addSelect('su.promoter_id', 'promoter_id')
			.addSelect('su.contact_id', 'contact_id')
			.addSelect('0', 'total_revenue')
			.addSelect('0', 'total_commission')
			.from('sign_up', 'su')
			.innerJoin('contact', 'c', 'c.contact_id = su.contact_id');

		const unionQuery = `
    (${revenueSubquery.getQuery()}) 
    UNION ALL 
    (${commissionSubquery.getQuery()}) 
    UNION ALL 
    (${signupSubquery.getQuery()})
`;

		return datasource
			.createQueryBuilder()
			.select('combined.program_id', 'program_id')
			.addSelect('combined.promoter_id', 'promoter_id')
			.addSelect('combined.contact_id', 'contact_id')
			.addSelect('SUM(combined.total_revenue)', 'total_revenue')
			.addSelect('SUM(combined.total_commission)', 'total_commission')
			.addSelect(
				`
        CASE 
        WHEN program.referral_key_type = 'email' THEN contact.email 
        ELSE contact.phone 
        END
    `,
				'contact_info',
			)
			.from(`(${unionQuery})`, 'combined')
			.innerJoin(
				'contact',
				'contact',
				'contact.contact_id = combined.contact_id',
			)
			.innerJoin(
				'program',
				'program',
				'program.program_id = combined.program_id',
			)
			.groupBy('combined.program_id')
			.addGroupBy('combined.promoter_id')
			.addGroupBy('combined.contact_id')
			.addGroupBy('contact.email')
			.addGroupBy('contact.phone')
			.addGroupBy('program.referral_key_type')
			.setParameters({
				...revenueSubquery.getParameters(),
				...commissionSubquery.getParameters(),
				...signupSubquery.getParameters(),
			});
	},
	materialized: true,
})
export class ReferralView {
	@Index()
	@PrimaryColumn('uuid', { name: 'program_id' })
	programId: string;

	@Index()
	@PrimaryColumn('uuid', { name: 'promoter_id' })
	promoterId: string;

	@Index()
	@Column('uuid', { name: 'contact_id' })
	contactId: string;

	@PrimaryColumn('varchar', { name: 'contact_info' })
	contactInfo: string;

	@Column('decimal', { name: 'total_revenue' })
	totalRevenue: number;

	@Column('decimal', { name: 'total_commission' })
	totalCommission: number;
}

@ViewEntity({
	name: 'referral_mv_aggregate',
	expression: (datasource: DataSource) => {
		return datasource
			.createQueryBuilder()
			.from('referral_mv', 'rv')
			.select('rv.program_id', 'program_id')
			.addSelect('rv.promoter_id', 'promoter_id')
			.addSelect('SUM(rv.total_revenue)', 'total_revenue')
			.addSelect('SUM(rv.total_commission)', 'total_commission')
			.groupBy('rv.program_id, rv.promoter_id');
	},
	materialized: true,
})
export class ReferralViewAggregate {
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
}
