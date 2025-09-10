import { PurchaseRow, PurchaseTable } from "@org-quicko/cliq-sheet-core/Commission/beans";
import { Commission, Purchase } from "../../entities";
import { formatDate } from "../../utils";
import { ConverterException } from "@org-quicko/core";

export class PurchaseTableConverter {
	convertFrom(
		purchasesCommissions: Map<string, Commission[]>,
		purchases: Purchase[]
	) {
		try {
			const purchasesTable = new PurchaseTable();

			purchases.forEach((purchase) => {
				const row = new PurchaseRow([]);
	
				let commissionAmount = 0;

				const commissions = purchasesCommissions.get(purchase.purchaseId) ?? [];

				commissions.forEach((commission) => {
					commissionAmount += commission.amount;
				});
	
				row.setPurchaseId(purchase.purchaseId);
				row.setPurchaseDate(formatDate(purchase.createdAt));
				row.setContactId(purchase.contact.contactId);
				row.setItemId(purchase.itemId);
				row.setAmount(purchase.amount);
				row.setCommission(commissionAmount);
				row.setExternalId(purchase.contact.externalId || '');
				row.setUtmId(purchase?.utmParams?.utmId || '');
				row.setUtmSource(purchase?.utmParams?.utmSource || '');
				row.setUtmMedium(purchase?.utmParams?.utmMedium || '');
				row.setUtmCampaign(purchase?.utmParams?.utmCampaign || '');
				row.setUtmTerm(purchase?.utmParams?.utmTerm || '');
				row.setUtmContent(purchase?.utmParams?.utmContent || '');
	
				purchasesTable.addRow(row);
			});
			
			return purchasesTable;
			
		} catch (error) {
			throw new ConverterException('Error converting purchases to table', error);
		}
	}
}