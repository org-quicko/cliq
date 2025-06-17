import { PurchaseSummaryList } from "@org-quicko/cliq-sheet-core/Purchase/beans";
import { formatDate } from "../../utils";

export interface PurchaseSummaryListConverterInterface {
	purchasesSummaryList: PurchaseSummaryList, 
	startDate: Date,
	endDate: Date,
	promoterId: string,
	promoterName: string,
	totalPurchases: number,
	totalRevenue: number,
	totalCommission: number,
}

export class PurchaseSummaryListConverter {
	convertFrom({
		purchasesSummaryList,
		startDate,
		endDate,
		promoterId,
		promoterName,
		totalPurchases,
		totalRevenue,
		totalCommission,
	}: PurchaseSummaryListConverterInterface) {
		purchasesSummaryList.addFrom(formatDate(startDate));
		purchasesSummaryList.addTo(formatDate(endDate));
		purchasesSummaryList.addPromoterId(promoterId);
		purchasesSummaryList.addPromoterName(promoterName);
		purchasesSummaryList.addPurchases(totalPurchases);

		purchasesSummaryList.addRevenue(totalRevenue);
		purchasesSummaryList.addTotalCommission(totalCommission);
	}
}