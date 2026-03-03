import { PromoterAnalyticsRow, PromoterAnalyticsTable } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { ConverterException } from '@org-quicko/core';

export interface IPromoterAnalyticsInput {
	programId: string;
	promoterId: string;
	promoterName?: string;
	totalSignUps: number;
	totalPurchases: number;
	totalRevenue: number;
	totalCommission: number;
	signupCommission?: number;
	purchaseCommission?: number;
}

export class PromoterAnalyticsTableConverter {
	convertFrom(
		promoterAnalytics: IPromoterAnalyticsInput[]
	) {
		try {
			const promoterAnalyticsTable = new PromoterAnalyticsTable();

			promoterAnalytics.forEach((referralAgg) => {
				const row = new PromoterAnalyticsRow([]);

				row.setProgramId(referralAgg.programId);
				row.setPromoterId(referralAgg.promoterId);
				if (referralAgg.promoterName) {
					row.setPromoterName(referralAgg.promoterName);
				}
				row.setTotalSignups(Number(referralAgg.totalSignUps));
				row.setTotalPurchases(Number(referralAgg.totalPurchases));
				row.setTotalRevenue(Number(referralAgg.totalRevenue));
				row.setTotalCommission(Number(referralAgg.totalCommission));
				row.setSignupCommission(Number(referralAgg.signupCommission ?? 0));
				row.setPurchaseCommission(Number(referralAgg.purchaseCommission ?? 0));

				promoterAnalyticsTable.addRow(row);
			});

			return promoterAnalyticsTable;
			
		} catch (error) {
			throw new ConverterException('Failed to convert to Promoter Analytics Table', error);
		}
	}
}