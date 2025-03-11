import { Injectable } from '@nestjs/common';
import { PurchaseDto } from '../dtos';
import { Purchase } from '../entities';
import { PromoterWorkbook, PurchaseRow, PurchaseSheet, PurchaseTable } from 'generated/sources';
import { maskInfo } from 'src/utils';

@Injectable()
export class PurchaseConverter {
	convert(purchase: Purchase): PurchaseDto {
		const purchaseDto = new PurchaseDto();

		purchaseDto.purchaseId = purchase.purchaseId;

		purchaseDto.linkId = purchase.link.linkId;
		purchaseDto.email = purchase.contact.email;
		purchaseDto.amount = purchase.amount;
		purchaseDto.firstName = purchase.contact.firstName;
		purchaseDto.lastName = purchase.contact.lastName;
		purchaseDto.phone = purchase.contact.phone;
		purchaseDto.itemId = purchase.itemId;
		purchaseDto.contactId = purchase.contact.contactId;

		purchaseDto.createdAt = new Date(purchase.createdAt);
		purchaseDto.updatedAt = new Date(purchase.updatedAt);

		return purchaseDto;
	}

	getSheetRow(purchase: Purchase): PurchaseRow {
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

		return newPurchaseRow;
	}

	convertToSheetJson(purchases: Purchase[]): PromoterWorkbook {

		const newPurchaseTable = new PurchaseTable();
		purchases.forEach((purchase) => {
			const newPurchaseRow = this.getSheetRow(purchase);
			newPurchaseTable.addRow(newPurchaseRow);
		});

		const purchaseSheet = new PurchaseSheet();
		purchaseSheet.addPurchaseTable(newPurchaseTable);

		const promoterWorkbook = new PromoterWorkbook();
		promoterWorkbook.addSheet(purchaseSheet);

		return promoterWorkbook;
	}
}
