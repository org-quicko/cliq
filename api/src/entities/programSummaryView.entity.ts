import { ViewColumn, PrimaryColumn, ViewEntity, Index } from 'typeorm';

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
	@Index()
	@ViewColumn({ name: 'program_id' })
	programId: string;

	@ViewColumn({ name: 'program_name' })
	programName: string;

	@ViewColumn({ name: 'total_promoters' })
	totalPromoters: number;

	@ViewColumn({ name: 'total_referrals' })
	totalReferrals: number;

	@ViewColumn({ name: 'created_at' })
	createdAt: Date;
}
