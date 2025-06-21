import { Link, Purchase } from "../../entities";
import { formatDate } from "../../utils";
import { LinkSummaryList } from "@org-quicko/cliq-sheet-core/Link/beans";
import { conversionTypeEnum } from "../../enums";
import { ConverterException } from "@org-quicko/core";

export interface ILinkSummaryListConverterInput {
	links: Link[],
	linkSignUpsMap: Map<string, number>,
	linkPurchasesMap: Map<string, Purchase[]>,
	startDate: Date;
	endDate: Date;
}

export class LinkSummaryListConverter {
	convertFrom({
		links,
		linkSignUpsMap,
		linkPurchasesMap,
		startDate,
		endDate,
	}: ILinkSummaryListConverterInput) {

		try {
			const linksSummaryList = new LinkSummaryList();

			const totalLinks = links.length;
			let totalSignUpsCommission = 0;
			let totalPurchasesCommission = 0;
			let totalSignUps = 0;
			let totalPurchases = 0;
			let totalRevenue = 0;
	
			links.forEach((link) => {
				let signUpsCommission = 0;
				let purchasesCommission = 0;
	
				link.commissions.forEach((commission) => {
					if (commission.conversionType === conversionTypeEnum.SIGNUP) {
						signUpsCommission += commission.amount;
	
					} else if (commission.conversionType === conversionTypeEnum.PURCHASE) {
						purchasesCommission += commission.amount;
					}
				});
	
				totalSignUps += linkSignUpsMap.get(link.linkId) || 0;
				totalPurchases += linkPurchasesMap.get(link.linkId)?.length || 0;
				totalSignUpsCommission += signUpsCommission;
				totalPurchasesCommission += purchasesCommission;
				
				const purchases = linkPurchasesMap.get(link.linkId) || [];
				totalRevenue += purchases.reduce((sum, purchase) => {
					return sum + purchase.amount;
				}, 0);
				
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