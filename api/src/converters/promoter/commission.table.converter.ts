import { CommissionRow, CommissionTable } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { ConverterException, JSONObject } from "@org-quicko/core";
import { Commission } from "../../entities";
import { referralKeyTypeEnum } from "../../enums";
import { maskInfo } from "../../utils";

export class CommissionTableConverter {
	convertFrom(
		commissions: Commission[], 
		referralKeyType: referralKeyTypeEnum, 
		metadata: { count: number }
	) {
		try {
			const commissionTable = new CommissionTable();

			if (commissions && commissions.length > 0) {
				commissions.forEach((commission) => {
					const row = new CommissionRow([]);
		
					const referral = (referralKeyType === referralKeyTypeEnum.EMAIL) ? commission.contact.email : commission.contact.phone;
	
					row.setCommissionId(commission.commissionId);
					row.setContactId(commission.contact.contactId);
					row.setLinkId(commission.linkId);
					row.setReferral(maskInfo(referral));
					row.setCommission(Number(commission.amount));
					row.setConversionType(commission.conversionType);
					row.setRevenue(Number(commission.revenue ?? 0));
					row.setCreatedAt(commission.createdAt.toISOString());
					row.setUpdatedAt(commission.updatedAt.toISOString());
		
					commissionTable.addRow(row);
				});
			}
	
			commissionTable.setMetadata(new JSONObject(metadata));
			
			return commissionTable;
			
		} catch (error) {
			throw new ConverterException('Failed to convert to Commission Table', error);
		}
	}
}