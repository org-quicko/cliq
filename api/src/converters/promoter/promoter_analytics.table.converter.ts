import { PromoterAnalyticsRow, PromoterAnalyticsTable } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { PromoterAnalyticsView } from "src/entities";

export class PromoterAnalyticsTableConverter {
	convertFrom(
		promoterAnalyticsTable: PromoterAnalyticsTable,
		promoterAnalytics: PromoterAnalyticsView[]
	) {
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
	}
}