import { PurchaseSummaryList } from "@org-quicko/cliq-sheet-core/Purchase/beans";
import { formatDate } from "../../utils";
import { Commission, Purchase } from "../../entities";
import { ConverterException } from '@org-quicko/core';

export interface IPurchaseSummaryListConverterInput {
	startDate: Date,
	endDate: Date,
	promoterId: string,
	promoterName: string,
	purchases: Purchase[],
	purchasesCommissions: Map<string, Commission[]>,
}

export class PurchaseSummaryListConverter {
	convertFrom({
		startDate,
		endDate,
		promoterId,
		promoterName,
		purchases,
		purchasesCommissions
	}: IPurchaseSummaryListConverterInput) {
		try {
			const purchasesSummaryList = new PurchaseSummaryList();

			const totalPurchases = purchases.length;
			let totalRevenue = 0;
			const totalCommission = purchases.reduce((acc, purchase) => {
				let commissionAmount = 0;

				const commissions = purchasesCommissions.get(purchase.purchaseId) ?? [];

				commissions.forEach((commission) => {
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

			return purchasesSummaryList;
		} catch (error) {
			throw new ConverterException('Failed to convert to Purchase Summary List', error);
		}
	}
}