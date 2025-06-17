import { formatDate } from "../../utils";
import { LinkSummaryList } from "@org-quicko/cliq-sheet-core/Link/beans";

export interface LinkSummaryListConverterInputInterface {
	linksSummaryList: LinkSummaryList;
	startDate: Date;
	endDate: Date;
	totalLinks: number;
	totalSignUps: number;
	totalSignUpsCommission: number;
	totalPurchases: number;
	totalPurchasesCommission: number;
	totalRevenue: number;
}

export class LinkSummaryListConverter {
	convertFrom({
		linksSummaryList,
		startDate,
		endDate,
		totalLinks,
		totalSignUps,
		totalSignUpsCommission,
		totalPurchases,
		totalPurchasesCommission,
		totalRevenue,
	}: LinkSummaryListConverterInputInterface) {

		linksSummaryList.addFrom(formatDate(startDate));
		linksSummaryList.addTo(formatDate(endDate));
		linksSummaryList.addLinks(totalLinks);
		linksSummaryList.addSignups(totalSignUps);
		linksSummaryList.addCommissionOnSignups(totalSignUpsCommission);
		linksSummaryList.addPurchases(totalPurchases);
		linksSummaryList.addCommissionOnPurchases(totalPurchasesCommission);
		linksSummaryList.addRevenue(totalRevenue);
		linksSummaryList.addTotalCommission(totalSignUpsCommission + totalPurchasesCommission);
	}
}