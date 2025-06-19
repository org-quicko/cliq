import { Purchase, ReferralView } from "../../entities";
import { PurchaseSheet, ReferralSheet } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { ReferralTableConverter } from "./referral.table.converter";
import { ConverterException } from '@org-quicko/core';

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
		{
			referrals,
			metadata
		}: IReferralSheetConverterInput
	) {
		try {
			const referralsSheet = new ReferralSheet();

			const referralTable = this.referralTableConverter.convertFrom(
				referrals,
				metadata
			);
			referralsSheet.replaceBlock(referralTable);
			
			return referralsSheet;
			
		} catch (error) {
			throw new ConverterException('Failed to convert to Referral Sheet', error);
		}
	}
}