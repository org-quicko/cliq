import { Link } from "../../entities";
import { formatDate } from "../../utils";
import { LinkSummaryList } from "@org-quicko/cliq-sheet-core/Link/beans";
import { conversionTypeEnum } from "../../enums";
import { ConverterException } from "@org-quicko/core";

export interface ILinkSummaryListConverterInput {
	linksSummaryList: LinkSummaryList,
	links: Link[],
	startDate: Date;
	endDate: Date;
}

export class LinkSummaryListConverter {
	convertFrom({
		linksSummaryList,
		links,
		startDate,
		endDate,
	}: ILinkSummaryListConverterInput) {

		try {
			const totalLinks = links.length;
			let totalSignUpsCommission = 0;
			let totalPurchasesCommission = 0;
			let totalSignUps = 0;
			let totalPurchases = 0;
			let totalRevenue = 0;
	
			links.forEach((link) => {
				let signUpsCommission = 0;
				let purchasesCommission = 0;
				let signUps = 0;
				let purchases = 0;
				let revenue = 0;
	
				link.commissions.forEach((commission) => {
					if (commission.conversionType === conversionTypeEnum.SIGNUP) {
						signUpsCommission += Number(commission.amount);
						signUps++;
	
					} else if (commission.conversionType === conversionTypeEnum.PURCHASE) {
						purchasesCommission += Number(commission.amount);
						purchases++;
						revenue += Number(commission.revenue);
					}
				});
	
				totalSignUps += Number(signUps);
				totalPurchases += Number(purchases);
				totalSignUpsCommission += Number(signUpsCommission);
				totalPurchasesCommission += Number(purchasesCommission);
				totalRevenue += Number(revenue);
			});
	
			linksSummaryList.addFrom(formatDate(startDate));
			linksSummaryList.addTo(formatDate(endDate));
			linksSummaryList.addLinks(totalLinks);
			linksSummaryList.addSignups(totalSignUps);
			linksSummaryList.addCommissionOnSignups(totalSignUpsCommission);
			linksSummaryList.addPurchases(totalPurchases);
			linksSummaryList.addCommissionOnPurchases(totalPurchasesCommission);
			linksSummaryList.addRevenue(totalRevenue);
			linksSummaryList.addTotalCommission(totalSignUpsCommission + totalPurchasesCommission);
	
			return linksSummaryList;
			
		} catch (error) {
			throw new ConverterException('Failed to convert to LinkSummaryList', error);
		}
	}
}