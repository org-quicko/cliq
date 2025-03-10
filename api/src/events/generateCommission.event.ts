import { conversionTypeEnum } from '../enums';

export class GenerateCommissionEvent {
	constructor(
		public contactId: string,
		public conversionType: conversionTypeEnum,
		public promoterId: string,
		public amount: number,
	) {}
}

export const GENERATE_COMMISSION_EVENT = 'generate_commission_event';
