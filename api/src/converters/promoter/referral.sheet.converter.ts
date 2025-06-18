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
		referralsSheet: ReferralSheet,
		{
			referrals,
			metadata
		}: IReferralSheetConverterInput
	) {
		try {
			this.referralTableConverter.convertFrom(
				referralsSheet.getReferralTable(),
				referrals,
				metadata
			);
		} catch (error) {
			throw new ConverterException('Failed to convert to Referral Sheet', error);
		}
	}
}