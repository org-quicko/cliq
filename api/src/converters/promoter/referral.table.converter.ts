import { ReferralRow, ReferralTable } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { JSONObject } from "@org-quicko/core";
import { ReferralView } from "src/entities";
import { maskInfo } from "src/utils";

export class ReferralTableConverter {
	convertFrom(
		referralTable: ReferralTable, 
		referrals: ReferralView[], 
		metadata: { count: number }
	) {
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
	}
}