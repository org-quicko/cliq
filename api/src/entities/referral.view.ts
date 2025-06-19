import { referralMVName } from '../constants';
import { contactStatusEnum } from '../enums';
import { NumericToNumber } from '../utils/numericToNumber.util';
import {
	ViewEntity,
	DataSource,
	SelectQueryBuilder,
	Index,
	CreateDateColumn,
	UpdateDateColumn,
	ViewColumn,
} from 'typeorm';

@ViewEntity({
	name: referralMVName,
	expression: (datasource: DataSource): SelectQueryBuilder<any> => {
		const revenueSubquery = datasource
			.createQueryBuilder()
			.select('c.program_id', 'program_id')
			.addSelect('pu.promoter_id', 'promoter_id')
			.addSelect('c.contact_id', 'contact_id')
			.addSelect('SUM(pu.amount)', 'total_revenue')
			.addSelect('0', 'total_commission')
			.addSelect('MAX(pu.updated_at)', 'updated_at') // Capture the latest purchase timestamp
			.addSelect('MIN(pu.created_at)', 'created_at')
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
			.addSelect('MAX(com.updated_at)', 'updated_at') // Capture the latest commission timestamp
			.addSelect('MIN(com.created_at)', 'created_at')
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
			.addSelect('MAX(su.updated_at)', 'updated_at') // Capture the latest signup timestamp
			.addSelect('MIN(su.created_at)', 'created_at')
			.from('sign_up', 'su')
			.innerJoin('contact', 'c', 'c.contact_id = su.contact_id')
			.groupBy('c.program_id')
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
			.addSelect('contact.status', 'status') // Correct status fetched from `contact`
			.addSelect('combined.promoter_id', 'promoter_id')
			.addSelect('combined.contact_id', 'contact_id')
			.addSelect('SUM(combined.total_revenue)', 'total_revenue')
			.addSelect('SUM(combined.total_commission)', 'total_commission')
			.addSelect('MAX(combined.updated_at)', 'updated_at') // Get the latest referral date
			.addSelect('MIN(combined.created_at)', 'created_at')
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
			.addGroupBy('contact.status') // Ensure correct grouping of status
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
	}
	,
	materialized: true,
})
export class ReferralView {
	@Index()
	@ViewColumn({ name: 'program_id' })
	programId: string;

	@Index()
	@ViewColumn({ name: 'promoter_id' })
	promoterId: string;

	@ViewColumn({ name: 'status' })
	status: contactStatusEnum;

	@Index()
	@ViewColumn({ name: 'contact_id' })
	contactId: string;

	@ViewColumn({ name: 'contact_info' })
	contactInfo: string;

	@ViewColumn({ name: 'total_revenue', transformer: NumericToNumber })
	totalRevenue: number;

	@ViewColumn({ name: 'total_commission', transformer: NumericToNumber })
	totalCommission: number;

	@CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
	updatedAt: Date;
}
