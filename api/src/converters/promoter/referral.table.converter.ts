import { ReferralRow, ReferralTable } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { JSONObject } from "@org-quicko/core";
import { ReferralView } from "../../entities";
import { maskInfo } from "../../utils";
import { ConverterException } from '@org-quicko/core';

export class ReferralTableConverter {
	convertFrom(
		referralTable: ReferralTable,
		referrals: ReferralView[],
		metadata: { count: number }
	) {
		try {
			referralTable.setMetadata(new JSONObject(metadata));

			referrals.forEach((referral) => {
				const row = new ReferralRow([]);

				row.setPromoterId(referral.promoterId);
				row.setStatus(referral.status);
				row.setContactId(referral.contactId);
				row.setContactInfo(maskInfo(referral.contactInfo));
				row.setTotalRevenue(Number(referral.totalRevenue));
				row.setTotalCommission(Number(referral.totalCommission));
				row.setUpdatedAt(referral.updatedAt.toISOString());

				referralTable.addRow(row);
			});
		} catch (error) {
			throw new ConverterException('Failed to convert to Referral Table', error);
		}
	}
}