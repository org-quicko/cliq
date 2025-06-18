import { PurchaseRow, PurchaseTable } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { Purchase } from "../../entities";
import { maskInfo } from "../../utils";
import { ConverterException } from '@org-quicko/core';

export class PurchaseTableConverter {
	/** For getting purchases data for the promoter */
	convertFrom(
		purchaseTable: PurchaseTable,
		purchases: Purchase[]
	) {
		try {
			purchases.forEach((purchase) => {
				const newPurchaseRow = new PurchaseRow([]);

				newPurchaseRow.setContactId(purchase.contact.contactId);
				newPurchaseRow.setFirstName(purchase.contact.firstName);
				newPurchaseRow.setLastName(purchase.contact.lastName);
				newPurchaseRow.setEmail(maskInfo(purchase.contact.email));
				newPurchaseRow.setPhone(maskInfo(purchase.contact.phone));
				newPurchaseRow.setAmount(purchase.amount);
				newPurchaseRow.setItemId(purchase.itemId);
				newPurchaseRow.setLinkId(purchase.link.linkId);
				newPurchaseRow.setCreatedAt(purchase.createdAt.toISOString());

				purchaseTable.addRow(newPurchaseRow);
			});
		} catch (error) {
			throw new ConverterException('Failed to convert to Purchase Table', error);
		}
	}
}