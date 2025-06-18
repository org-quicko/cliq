import { LinkAnalyticsRow, LinkAnalyticsTable } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { ConverterException, JSONObject } from "@org-quicko/core";
import { LinkAnalyticsView } from "../../entities";

export class LinkAnalyticsTableConverter {
	convertFrom(
		linkAnalyticsTable: LinkAnalyticsTable,
		linkAnalytics: LinkAnalyticsView[], 
		metadata: {
			website: string,
			programId: string,
			count: number
		}
	) {
		try {
			linkAnalytics.forEach((linkStat) => {
				const row = new LinkAnalyticsRow([]);
	
				row.setLinkId(linkStat.linkId);
				row.setLinkName(linkStat.name);
				row.setRefVal(linkStat.refVal);
				row.setPromoterId(linkStat.promoterId);
				row.setSignups(Number(linkStat.signups));
				row.setPurchases(Number(linkStat.purchases));
				row.setCommission(Number(linkStat.commission));
				row.setCreatedAt(linkStat.createdAt.toISOString()); 
				
				linkAnalyticsTable.addRow(row);
			});
	
			linkAnalyticsTable.setMetadata(new JSONObject(metadata));
			
		} catch (error) {
			throw new ConverterException('Failed to convert to LinkAnalyticsTable', error);
		}
	}
}