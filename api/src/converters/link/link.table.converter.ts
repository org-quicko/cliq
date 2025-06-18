import { conversionTypeEnum } from "../../enums";
import { Link } from "../../entities";
import { LinkRow, LinkTable } from "@org-quicko/cliq-sheet-core/Link/beans";
import { ConverterException } from "@org-quicko/core";

export class LinkTableConverter {
	convertFrom(
		linksTable: LinkTable,
		links: Link[],
	) {
		try {
			links.forEach((link) => {
				const row = new LinkRow([]);

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

				row.setLinkName(link.name);
				row.setLink(link.program.website + '?ref=' + link.refVal);
				row.setSignups(Number(signUps));
				row.setSignups(Number(signUps));
				row.setPurchases(Number(purchases));
				row.setCommissionOnSignups(Number(signUpsCommission));
				row.setCommissionOnPurchases(Number(purchasesCommission));
				row.setRevenue(Number(revenue));
				row.setTotalCommission(Number(signUpsCommission) + Number(purchasesCommission));

				linksTable.addRow(row);
			});
		} catch (error) {
			throw new ConverterException('Error in LinkTableConverter.convertFrom: ', error);
		}
	}
}