import 'dotenv/config';
import { QueryOptionsInterface } from './interfaces/queryOptions.interface';

export const SALT_ROUNDS = process.env.SALT_ROUNDS
	? parseInt(process.env.SALT_ROUNDS)
	: 10;

export const referralMVName = 'referral_mv';
export const promoterAnalyticsMVName = 'promoter_analytics_mv';
export const linkAnalyticsMVName = 'link_analytics_mv';

export const signUpEntityName = 'org.quicko.cliq.signup';
export const purchaseEntityName = 'org.quicko.cliq.purchase';
export const commissionEntityName = 'org.quicko.cliq.commission';

export const eventTypePrefix = 'org.quicko.cliq';

export const eventQueueName = 'org-quicko-cliq-event-queue';

export const linkTableName = 'link';

export const defaultQueryOptions: QueryOptionsInterface = { skip: 0, take: 10 };