import { conversionTypeEnum } from "../../enums";
import { Link } from "../../entities";
import { LinkRow, LinkTable } from "@org-quicko/cliq-sheet-core/Link/beans";
import { ConverterException } from "@org-quicko/core";

export class LinkTableConverter {
	convertFrom(
		links: Link[],
	) {
		try {
			const linksTable = new LinkTable();

			links.forEach((link) => {
				const row = new LinkRow([]);

				let signUpsCommission = 0;
				let purchasesCommission = 0;
				let signUps = 0;
				let purchases = 0;
				let revenue = 0;

				link.commissions.forEach((commission) => {
					if (commission.conversionType === conversionTypeEnum.SIGNUP) {
						signUpsCommission += commission.amount;
						signUps++;

					} else if (commission.conversionType === conversionTypeEnum.PURCHASE) {
						purchasesCommission += commission.amount;
						purchases++;
						revenue += commission.revenue;
					}
				});

				row.setLinkName(link.name);
				row.setLink(link.program.website + '?ref=' + link.refVal);
				row.setSignups(signUps);
				row.setCommissionOnSignups(signUpsCommission);
				row.setPurchases(purchases);
				row.setCommissionOnPurchases(purchasesCommission);
				row.setRevenue(revenue);
				row.setTotalCommission(signUpsCommission + purchasesCommission);

				linksTable.addRow(row);
			});

			return linksTable;
		} catch (error) {
			throw new ConverterException('Error in LinkTableConverter.convertFrom: ', error);
		}
	}
}