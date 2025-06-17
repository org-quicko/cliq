import { CommissionSummaryList } from "@org-quicko/cliq-sheet-core/Commission/beans";
import { formatDate } from "../../utils";

export interface CommissionSummaryListConverterInterface {
	commissionsSummaryList: CommissionSummaryList, 
	startDate: Date,
	endDate: Date,
	promoterId: string,
	promoterName: string,
	totalPurchases: number,
	totalSignUps: number,
	totalSignUpCommission: number,
	totalPurchaseCommission: number,
	totalRevenue: number,
}

export class CommissionSummaryListConverter {
	convertFrom({
		commissionsSummaryList,
		startDate,
		endDate,
		promoterId,
		promoterName,
		totalPurchases,
		totalSignUps,
		totalSignUpCommission,
		totalPurchaseCommission,
		totalRevenue,
	}: CommissionSummaryListConverterInterface) {
		commissionsSummaryList.addFrom(formatDate(startDate));
		commissionsSummaryList.addTo(formatDate(endDate));
		commissionsSummaryList.addPromoterId(promoterId);
		commissionsSummaryList.addPromoterName(promoterName);
		commissionsSummaryList.addPurchases(totalPurchases);
		commissionsSummaryList.addSignups(totalSignUps);
		commissionsSummaryList.addPurchases(totalPurchases);
		commissionsSummaryList.addCommissionOnSignups(totalSignUpCommission);
		commissionsSummaryList.addCommissionOnPurchases(totalPurchaseCommission);

		commissionsSummaryList.addRevenue(totalRevenue);
		commissionsSummaryList.addTotalCommission(totalSignUpCommission + totalPurchaseCommission);
	}
}