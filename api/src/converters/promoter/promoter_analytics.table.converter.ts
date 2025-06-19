import { PromoterAnalyticsRow, PromoterAnalyticsTable } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { PromoterAnalyticsView } from "../../entities";
import { ConverterException } from '@org-quicko/core';

export class PromoterAnalyticsTableConverter {
	convertFrom(
		promoterAnalytics: PromoterAnalyticsView[]
	) {
		try {
			const promoterAnalyticsTable = new PromoterAnalyticsTable();

			promoterAnalytics.forEach((referralAgg) => {
				const row = new PromoterAnalyticsRow([]);

				row.setProgramId(referralAgg.programId);
				row.setPromoterId(referralAgg.promoterId);
				row.setTotalSignups(Number(referralAgg.totalSignUps));
				row.setTotalPurchases(Number(referralAgg.totalPurchases));
				row.setTotalRevenue(Number(referralAgg.totalRevenue));
				row.setTotalCommission(Number(referralAgg.totalCommission));

				promoterAnalyticsTable.addRow(row);
			});

			return promoterAnalyticsTable;
			
		} catch (error) {
			throw new ConverterException('Failed to convert to Promoter Analytics Table', error);
		}
	}
}