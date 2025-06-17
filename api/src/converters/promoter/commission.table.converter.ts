import { CommissionRow, CommissionTable } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { JSONObject } from "@org-quicko/core";
import { Commission } from "src/entities";
import { referralKeyTypeEnum } from "src/enums";
import { maskInfo } from "src/utils";

export class CommissionTableConverter {
	convertFrom(
		commissionTable: CommissionTable,
		commissions: Commission[], 
		referralKeyType: referralKeyTypeEnum, 
		metadata: { count: number }
	) {
		if (commissions && commissions.length > 0) {
			commissions.forEach((commission) => {
				const row = new CommissionRow([]);
	
				const referral = (referralKeyType === referralKeyTypeEnum.EMAIL) ? commission.contact.email : commission.contact.phone;

				row.setCommissionId(commission.commissionId);
				row.setContactId(commission.contact.contactId);
				row.setCommission(Number(commission.amount));
				row.setConversionType(commission.conversionType);
				row.setRevenue(Number(commission.revenue ?? 0));
				row.setCreatedAt(commission.createdAt.toISOString());
				row.setUpdatedAt(commission.updatedAt.toISOString());
				row.setLinkId(commission.linkId);
				row.setReferral(maskInfo(referral));
	
				commissionTable.addRow(row);
			});
		}

		commissionTable.setMetadata(new JSONObject(metadata));
	}
}