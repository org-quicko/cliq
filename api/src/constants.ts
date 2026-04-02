import 'dotenv/config';
import { QueryOptionsInterface } from './interfaces/queryOptions.interface';
import { ConfigService } from '@nestjs/config';

export const SALT_ROUNDS = parseInt((new ConfigService()).get('SALT_ROUNDS') ?? '10');

export const referralMVName = 'referral_mv';
export const promoterAnalyticsMVName = 'promoter_analytics_mv';
export const linkAnalyticsMVName = 'link_analytics_mv';

export const signUpEntityName = 'in.org.quicko.cliq.signup';
export const purchaseEntityName = 'in.org.quicko.cliq.purchase';
export const commissionEntityName = 'in.org.quicko.cliq.commission';

export const eventTypePrefix = 'in.org.quicko.cliq';

export const eventQueueName = 'org-quicko-cliq-event-queue';

export const linkTableName = 'link';

export const defaultQueryOptions: QueryOptionsInterface = { skip: 0, take: 10 };