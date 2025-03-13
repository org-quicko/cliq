import { Injectable } from '@nestjs/common';
import { PurchaseDto } from '../dtos';
import { Promoter, Purchase } from '../entities';
import { PromoterInterfaceWorkbook, PurchaseRow, PurchaseSheet, PurchasesRow, PurchasesSummaryList, PurchasesTable, PurchaseTable, PurchaseWorkbook, PwPurchasesSheet, PwSummarySheet } from 'generated/sources';
import { maskInfo } from 'src/utils';
import { formatDate } from 'src/utils';
import { QueryOptionsInterface } from 'src/interfaces/queryOptions.interface';
import { defaultQueryOptions } from 'src/constants';
import { JSONObject } from '@org.quicko/core';

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

	convertToSheetJson(purchases: Purchase[], queryOptions: QueryOptionsInterface = defaultQueryOptions): PromoterInterfaceWorkbook {

		const purchaseTable = new PurchaseTable();
		purchases.forEach((purchase) => {
			const newPurchaseRow = this.getSheetRow(purchase);
			purchaseTable.addRow(newPurchaseRow);
		});

		purchaseTable.metadata = new JSONObject({
			...queryOptions
		});

		const purchaseSheet = new PurchaseSheet();
		purchaseSheet.addPurchaseTable(purchaseTable);

		const promoterWorkbook = new PromoterInterfaceWorkbook();
		promoterWorkbook.addSheet(purchaseSheet);

		return promoterWorkbook;
	}

	convertToReportWorkbook(
		purchases: Purchase[],
		promoter: Promoter,
		startDate: Date,
		endDate: Date,
	): PurchaseWorkbook {
		const purchaseWorkbook = new PurchaseWorkbook();

		const purchasesSheet = new PwPurchasesSheet();
		const purchasesTable = new PurchasesTable();
		const totalPurchases = purchases.length;
		let totalCommission = 0;
		let totalRevenue = 0;

		purchases.forEach((purchase) => {
			const row = new PurchasesRow([]);

			let commissionAmount = 0;
			purchase.contact.commissions.forEach((commission) => {
				commissionAmount += Number(commission.amount);
			});

			totalCommission += Number(commissionAmount);
			totalRevenue += Number(purchase.amount);

			row.setPurchaseId(purchase.purchaseId);
			row.setContactId(purchase.contact.contactId);
			row.setCommission(Number(commissionAmount));
			row.setItemId(purchase.itemId);
			row.setAmount(Number(purchase.amount));
			row.setPurchaseDate(formatDate(purchase.createdAt));
			row.setExternalId(purchase.contact.externalId);
			row.setUtmId(purchase?.utmParams?.utmId);
			row.setUtmSource(purchase?.utmParams?.utmSource);
			row.setUtmMedium(purchase?.utmParams?.utmMedium);
			row.setUtmCampaign(purchase?.utmParams?.utmCampaign);
			row.setUtmTerm(purchase?.utmParams?.utmTerm);
			row.setUtmContent(purchase?.utmParams?.utmContent);

			purchasesTable.addRow(row);
		});

		purchasesSheet.addPurchasesTable(purchasesTable);

		const summarySheet = new PwSummarySheet();
		const purchasesSummaryList = new PurchasesSummaryList();

		purchasesSummaryList.addFrom(formatDate(startDate));
		purchasesSummaryList.addTo(formatDate(endDate));
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
