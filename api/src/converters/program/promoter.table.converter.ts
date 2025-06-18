import { conversionTypeEnum } from "../../enums";
import { Program } from "../../entities";
import { PromoterRow, PromoterTable } from "@org-quicko/cliq-sheet-core/Program/beans";
import { ConverterException } from "@org-quicko/core";

export class PromoterTableConverter {
	convertFrom(
		promotersTable: PromoterTable,
		program: Program | null,
	) {
		try {
			if (program) {
				program.programPromoters.forEach((programPromoter) => {
					const promoter = programPromoter.promoter;

					const row = new PromoterRow([]);

					let signUpsCommission = 0;
					let purchasesCommission = 0;
					let revenue = 0;

					const signUps = promoter.signUps.length;
					const purchases = promoter.purchases.length;

					promoter.commissions.forEach((commission) => {
						if (commission.conversionType === conversionTypeEnum.SIGNUP) {
							signUpsCommission += commission.amount;

						} else if (commission.conversionType === conversionTypeEnum.PURCHASE) {
							purchasesCommission += commission.amount;
							revenue += commission.revenue;
						}
					});

					row.setPromoterId(promoter.promoterId);
					row.setPromoterName(promoter.name);
					row.setStatus(promoter.status);
					row.setSignups(signUps);
					row.setCommissionOnSignups(signUpsCommission);
					row.setPurchases(purchases);
					row.setCommissionOnPurchases(purchasesCommission);
					row.setRevenue(revenue);
					row.setTotalCommission(signUpsCommission + purchasesCommission);

					promotersTable.addRow(row);
				});
			}
		} catch (error) {
			throw new ConverterException('Error in PromoterTableConverter.convertFrom', error);
		}
	}
}