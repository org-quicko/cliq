import { Injectable } from '@nestjs/common';
import { PurchaseDto } from '../dtos';
import { Promoter, Purchase } from '../entities';
import { maskInfo } from 'src/utils';
import { formatDate } from 'src/utils';
import { QueryOptionsInterface } from 'src/interfaces/queryOptions.interface';
import { defaultQueryOptions } from 'src/constants';
import { JSONObject } from '@org.quicko/core';
import {
	PromoterWorkbook,
	PurchaseRow as PromoterPurchaseRow,
	PurchaseSheet as PromoterPurchaseSheet,
	PurchaseTable as PromoterPurchaseTable
} from 'generated/sources/Promoter';

import {
	PurchaseSummarySheet,
	PurchaseSheet,
	PurchaseWorkbook,
	PurchaseTable,
	PurchaseRow,
	PurchaseSummaryList
} from 'generated/sources/Purchase';

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

	/** For getting purchases data for the promoter */
	convertToSheetJson(purchases: Purchase[], queryOptions: QueryOptionsInterface = defaultQueryOptions): PromoterWorkbook {

		const purchaseTable = new PromoterPurchaseTable();
		purchases.forEach((purchase) => {
			const newPurchaseRow = new PromoterPurchaseRow([]);

			newPurchaseRow.setContactId(purchase.contact.contactId);
			newPurchaseRow.setFirstName(purchase.contact.firstName);
			newPurchaseRow.setLastName(purchase.contact.lastName);
			newPurchaseRow.setEmail(maskInfo(purchase.contact.email));
			newPurchaseRow.setPhone(maskInfo(purchase.contact.phone));
			newPurchaseRow.setAmount(purchase.amount);
			newPurchaseRow.setItemId(purchase.itemId);
			newPurchaseRow.setLinkId(purchase.link.linkId);
			newPurchaseRow.setCreatedAt(formatDate(purchase.createdAt));

			purchaseTable.addRow(newPurchaseRow);
		});

		purchaseTable.metadata = new JSONObject({
			...queryOptions
		});

		const purchaseSheet = new PromoterPurchaseSheet();
		purchaseSheet.addPurchaseTable(purchaseTable);

		const promoterWorkbook = new PromoterWorkbook();
		promoterWorkbook.addSheet(purchaseSheet);

		return promoterWorkbook;
	}

	/** For getting purchases report for the promoter */
	convertToReportWorkbook(
		purchases: Purchase[],
		promoter: Promoter,
		startDate: Date,
		endDate: Date,
	): PurchaseWorkbook {
		const purchaseWorkbook = new PurchaseWorkbook();

		const purchaseSheet = new PurchaseSheet();
		const purchaseTable = new PurchaseTable();
		const totalPurchases = purchases.length;
		let totalCommission = 0;
		let totalRevenue = 0;

		purchases.forEach((purchase) => {
			const row = new PurchaseRow([]);

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

			purchaseTable.addRow(row);
		});

		purchaseSheet.addPurchaseTable(purchaseTable);

		const summarySheet = new PurchaseSummarySheet();
		const purchasesSummaryList = new PurchaseSummaryList();

		purchasesSummaryList.addFrom(formatDate(startDate));
		purchasesSummaryList.addTo(formatDate(endDate));
		purchasesSummaryList.addPromoterId(promoter.promoterId);
		purchasesSummaryList.addPromoterName(promoter.name);
		purchasesSummaryList.addPurchases(Number(totalPurchases));
		purchasesSummaryList.addRevenue(Number(totalRevenue));
		purchasesSummaryList.addTotalCommission(Number(totalCommission));

		summarySheet.addPurchaseSummaryList(purchasesSummaryList);

		purchaseWorkbook.addPurchaseSummarySheet(summarySheet);
		purchaseWorkbook.addPurchaseSheet(purchaseSheet);

		return purchaseWorkbook;

	}

}
