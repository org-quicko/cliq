import { Column, PrimaryColumn, ViewEntity } from 'typeorm';

@ViewEntity({
	name: 'program_summary_mv',
	expression: `
		SELECT 
			p.program_id,
			p.name AS program_name,
			COALESCE(r.total_promoters, 0) AS total_promoters,
			COALESCE(r.total_referrals, 0) AS total_referrals,
			p.created_at
		FROM program p
		LEFT JOIN (
			SELECT 
				program_id,
				COUNT(promoter_id) AS total_promoters,
				COUNT(contact_id) AS total_referrals
			FROM referral_mv
			GROUP BY program_id
		) r ON p.program_id = r.program_id;
	`,
	materialized: true,
})
export class ProgramSummaryView {
	@PrimaryColumn({ name: 'program_id' })
	programId: string;

	@Column('varchar', { name: 'program_name' })
	programName: string;

	@Column('bigint', { name: 'total_promoters' })
	totalPromoters: number;

	@Column('bigint', { name: 'total_referrals' })
	totalReferrals: number;

	@Column('timestamp with time zone', {
		name: 'created_at',
	})
	createdAt: Date;
}
