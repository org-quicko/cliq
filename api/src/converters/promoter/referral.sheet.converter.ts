import { Purchase, ReferralView } from "src/entities";
import { PurchaseSheet, ReferralSheet } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { ReferralTableConverter } from "./referral.table.converter";

export interface IReferralSheetConverterInput {
	referrals: ReferralView[];
	metadata: { count: number };
};

export class ReferralSheetConverter {

	private referralTableConverter: ReferralTableConverter;

	constructor() {
		this.referralTableConverter = new ReferralTableConverter();
	}

	/** For getting purchases data for the promoter */
	convertFrom(
		referralsSheet: ReferralSheet, 
		{
			referrals, 
			metadata
		}: IReferralSheetConverterInput
	) {
		this.referralTableConverter.convertFrom(
			referralsSheet.getReferralTable(),
			referrals,
			metadata
		);
	}
}