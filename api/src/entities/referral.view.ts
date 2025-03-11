import { referralAggregateMVName, referralMVName } from 'src/constants';
import { contactStatusEnum } from 'src/enums';
import {
	ViewEntity,
	DataSource,
	SelectQueryBuilder,
	Column,
	PrimaryColumn,
	Index,
	CreateDateColumn,
} from 'typeorm';

@ViewEntity({
	name: referralMVName,
	expression: (datasource: DataSource): SelectQueryBuilder<any> => {
		const revenueSubquery = datasource
			.createQueryBuilder()
			.select('c.program_id', 'program_id')
			.addSelect('c.status', 'status')
			.addSelect('pu.promoter_id', 'promoter_id')
			.addSelect('c.contact_id', 'contact_id')
			.addSelect('SUM(pu.amount)', 'total_revenue')
			.addSelect('0', 'total_commission')
			.addSelect('MIN(pu.created_at)', 'created_at') // Capture the earliest purchase timestamp
			.from('contact', 'c')
			.innerJoin('purchase', 'pu', 'pu.contact_id = c.contact_id')
			.groupBy('c.program_id')
			.addGroupBy('c.status')
			.addGroupBy('pu.promoter_id')
			.addGroupBy('c.contact_id');

		const commissionSubquery = datasource
			.createQueryBuilder()
			.select('c.program_id', 'program_id')
			.addSelect('c.status', 'status')
			.addSelect('com.promoter_id', 'promoter_id')
			.addSelect('c.contact_id', 'contact_id')
			.addSelect('0', 'total_revenue')
			.addSelect('SUM(com.amount)', 'total_commission')
			.addSelect('MIN(com.created_at)', 'created_at') // Capture the earliest commission timestamp
			.from('contact', 'c')
			.innerJoin('commission', 'com', 'com.contact_id = c.contact_id')
			.groupBy('c.program_id')
			.addGroupBy('c.status')
			.addGroupBy('com.promoter_id')
			.addGroupBy('c.contact_id');

		const signupSubquery = datasource
			.createQueryBuilder()
			.select('c.program_id', 'program_id')
			.addSelect('c.status', 'status')
			.addSelect('su.promoter_id', 'promoter_id')
			.addSelect('su.contact_id', 'contact_id')
			.addSelect('0', 'total_revenue')
			.addSelect('0', 'total_commission')
			.addSelect('MIN(su.created_at)', 'created_at') // Capture the earliest signup timestamp
			.from('sign_up', 'su')
			.innerJoin('contact', 'c', 'c.contact_id = su.contact_id')
			.groupBy('c.program_id')
			.addGroupBy('c.status')
			.addGroupBy('su.promoter_id')
			.addGroupBy('su.contact_id');

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
			.addSelect('combined.status', 'status')
			.addSelect('combined.promoter_id', 'promoter_id')
			.addSelect('combined.contact_id', 'contact_id')
			.addSelect('SUM(combined.total_revenue)', 'total_revenue')
			.addSelect('SUM(combined.total_commission)', 'total_commission')
			.addSelect('MIN(combined.created_at)', 'created_at') // Get the earliest referral date
			.addSelect(`
        CASE 
        WHEN program.referral_key_type = 'email' THEN contact.email 
        ELSE contact.phone 
        END
    `, 'contact_info')
			.from(`(${unionQuery})`, 'combined')
			.innerJoin('contact', 'contact', 'contact.contact_id = combined.contact_id')
			.innerJoin('program', 'program', 'program.program_id = combined.program_id')
			.groupBy('combined.program_id')
			.addGroupBy('combined.status')
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

	@Column('enum', { enum: contactStatusEnum, name: 'status' })
	status: contactStatusEnum;

	@Index()
	@Column('uuid', { name: 'contact_id' })
	contactId: string;

	@Column('varchar', { name: 'contact_info' })
	contactInfo: string;

	@Column('decimal', { name: 'total_revenue' })
	totalRevenue: number;

	@Column('decimal', { name: 'total_commission' })
	totalCommission: number;

	@CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
	createdAt: Date;
}

@ViewEntity({
	name: referralAggregateMVName,
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
	materialized: true,
})
export class ReferralAggregateView {
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
