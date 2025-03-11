import 'dotenv/config';

export const SALT_ROUNDS = process.env.SALT_ROUNDS
	? parseInt(process.env.SALT_ROUNDS)
	: 10;

export const referralMVName = 'referral_mv';
export const referralAggregateMVName = 'referral_aggregate_mv';
export const linkStatsMVName = 'link_stats_mv';