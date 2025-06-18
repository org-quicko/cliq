import { PurchaseSummaryList } from "@org-quicko/cliq-sheet-core/Purchase/beans";
import { formatDate } from "../../utils";
import { Commission, Purchase } from "../../entities";
import { ConverterException } from '@org-quicko/core';

export interface IPurchaseSummaryListConverterInput {
	purchasesSummaryList: PurchaseSummaryList,
	startDate: Date,
	endDate: Date,
	promoterId: string,
	promoterName: string,
	purchases: Purchase[],
	purchasesCommissions: Map<string, Commission[]>,
}

export class PurchaseSummaryListConverter {
	convertFrom({
		purchasesSummaryList,
		startDate,
		endDate,
		promoterId,
		promoterName,
		purchases,
		purchasesCommissions
	}: IPurchaseSummaryListConverterInput) {
		try {
			const totalPurchases = purchases.length;
			let totalRevenue = 0;
			const totalCommission = purchases.reduce((acc, purchase) => {
				let commissionAmount = 0;

				purchasesCommissions.get(purchase.purchaseId)!.forEach((commission) => {
					commissionAmount += Number(commission.amount);
				});

				totalRevenue += purchase.amount;
				return acc + commissionAmount;

			}, 0);


			purchasesSummaryList.addFrom(formatDate(startDate));
			purchasesSummaryList.addTo(formatDate(endDate));
			purchasesSummaryList.addPromoterId(promoterId);
			purchasesSummaryList.addPromoterName(promoterName);
			purchasesSummaryList.addPurchases(totalPurchases);

			purchasesSummaryList.addRevenue(totalRevenue);
			purchasesSummaryList.addTotalCommission(totalCommission);
		} catch (error) {
			throw new ConverterException('Failed to convert to Purchase Summary List', error);
		}
	}
}