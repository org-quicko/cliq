import { conversionTypeEnum } from "../../enums";
import { Commission, Program, Purchase, SignUp } from "../../entities";
import { PromoterRow, PromoterTable } from "@org-quicko/cliq-sheet-core/Program/beans";
import { ConverterException } from "@org-quicko/core";

export class PromoterTableConverter {
	convertFrom(
		program: Program | null,
		promoterSignUpsMap: Map<string, SignUp[]>,
		promoterPurchasesMap: Map<string, Purchase[]>,
		promoterCommissionsMap: Map<string, Commission[]>,
	) {
		try {
			const promoterTable = new PromoterTable();
			if (program) {
				program.programPromoters.forEach((programPromoter) => {
					const promoter = programPromoter.promoter;

					const row = new PromoterRow([]);

					let signUpsCommission = 0;
					let purchasesCommission = 0;
					let revenue = 0;

					const numSignUps = promoterSignUpsMap.get(promoter.promoterId)?.length ?? 0;
					const numPurchases =  promoterPurchasesMap.get(promoter.promoterId)?.length ?? 0;

					const commissions = promoterCommissionsMap.get(promoter.promoterId) ?? [];
					
					commissions.forEach((commission) => {
						if (commission.conversionType === conversionTypeEnum.SIGNUP) {
							signUpsCommission += commission.amount;

						} else if (commission.conversionType === conversionTypeEnum.PURCHASE) {
							purchasesCommission += commission.amount;
						}
					});

					const purchases = promoterPurchasesMap.get(promoter.promoterId) ?? [];
					purchases.forEach(purchase => {
						revenue += purchase.amount;
					})

					row.setPromoterId(promoter.promoterId);
					row.setPromoterName(promoter.name);
					row.setStatus(promoter.status);
					row.setSignups(numSignUps);
					row.setCommissionOnSignups(signUpsCommission);
					row.setPurchases(numPurchases);
					row.setCommissionOnPurchases(purchasesCommission);
					row.setRevenue(revenue);
					row.setTotalCommission(signUpsCommission + purchasesCommission);

					promoterTable.addRow(row);
				});

			}
			return promoterTable;
		} catch (error) {
			throw new ConverterException('Error in PromoterTableConverter.convertFrom', error);
		}
	}
}