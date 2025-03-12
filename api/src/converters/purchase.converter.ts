import { Injectable } from '@nestjs/common';
import { PurchaseDto } from '../dtos';
import { Promoter, Purchase } from '../entities';
import { PromoterWorkbook, PurchaseRow, PurchaseSheet, PurchasesRow, PurchasesSummaryList, PurchasesTable, PurchaseTable, PurchaseWorkbook, PwPurchasesSheet, PwSummarySheet } from 'generated/sources';
import { maskInfo } from 'src/utils';
import { isAfter, isBefore } from 'date-fns';
import { formatDate } from 'src/utils/formatDate.util';

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

		purchaseDto.createdAt = purchase.createdAt;
		purchaseDto.updatedAt = purchase.updatedAt;

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
		newPurchaseRow.setCreatedAt(formatDate(purchase.createdAt));

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

	convertToReportWorkbook(
		purchases: Purchase[],
		promoter: Promoter,
		startDate?: Date,
		endDate?: Date,
	): PurchaseWorkbook {
		const purchaseWorkbook = new PurchaseWorkbook();

		const purchasesSheet = new PwPurchasesSheet();
		const purchasesTable = new PurchasesTable();
		const totalPurchases = purchases.length;
		let totalCommission = 0;
		let totalRevenue = 0;

		let fromDate: Date = purchases[0].createdAt;
		let toDate: Date = purchases[0].createdAt;

		purchases.forEach((purchase) => {
			const row = new PurchasesRow([]);

			let commissionAmount = 0;
			purchase.contact.commissions.forEach((commission) => {
				commissionAmount += Number(commission.amount);
			});

			totalCommission += Number(commissionAmount);
			totalRevenue += Number(purchase.amount);

			if (!startDate && !endDate) {
				fromDate = isBefore(purchase.createdAt, fromDate) ? purchase.createdAt : fromDate;
				toDate = isAfter(purchase.createdAt, toDate) ? purchase.createdAt : toDate;
			}

			row.setPurchaseId(purchase.purchaseId);
			row.setContactId(purchase.contact.contactId);
			row.setCommission(Number(commissionAmount));
			row.setItemId(purchase.itemId);
			row.setAmount(Number(purchase.amount));
			row.setPurchaseDate(formatDate(purchase.createdAt));
			row.setUtmSource(purchase?.utmParams?.source);
			row.setUtmMedium(purchase?.utmParams?.medium);

			purchasesTable.addRow(row);
		});

		purchasesSheet.addPurchasesTable(purchasesTable);

		const summarySheet = new PwSummarySheet();
		const purchasesSummaryList = new PurchasesSummaryList();

		purchasesSummaryList.addFrom(formatDate(startDate ? startDate : fromDate));
		purchasesSummaryList.addTo(formatDate(endDate ? endDate : toDate));
		purchasesSummaryList.addPromoterId(promoter.promoterId);
		purchasesSummaryList.addPromoterName(promoter.name);
		purchasesSummaryList.addPurchases(Number(totalPurchases));
		purchasesSummaryList.addRevenue(Number(totalRevenue));
		purchasesSummaryList.addTotalCommission(Number(totalCommission));

		summarySheet.addPurchasesSummaryList(purchasesSummaryList);

		purchaseWorkbook.addPwSummary(summarySheet);
		purchaseWorkbook.addPwPurchases(purchasesSheet);

		return purchaseWorkbook;

	}

}
