import { LinkWorkbook } from "@org-quicko/cliq-sheet-core/Link/beans";
import { Link } from "../../entities";
import { LinkTableConverter } from "./link.table.converter";
import { LinkSummaryListConverter } from "./link_summary.list.converter";
import { conversionTypeEnum } from "../../enums";

export class LinkWorkbookConverter {

	private linkTableConverter: LinkTableConverter;

	private linkSummaryListConverter: LinkSummaryListConverter;
	
	constructor() {
		this.linkTableConverter = new LinkTableConverter();
	}

	/** For getting link report inside Link Workbook */
	convertFrom(
		links: Link[],
		startDate: Date,
		endDate: Date,
	): LinkWorkbook {
		const linkWorkbook = new LinkWorkbook();

		const linksSheet = linkWorkbook.getLinkSheet();
		const linksTable = linksSheet.getLinkTable();

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

		this.linkTableConverter.convertFrom(
			linksTable,
			links,
		);

		this.linkSummaryListConverter.convertFrom({
			linksSummaryList: linkWorkbook.getLinkSummarySheet().getLinkSummaryList(),
			startDate,
			endDate,
			totalLinks,
			totalSignUps,
			totalSignUpsCommission,
			totalPurchases,
			totalPurchasesCommission,
			totalRevenue,
		});

		return linkWorkbook;

	}
}