import { DateWisePromoterAnalyticsRow, DateWisePromoterAnalyticsTable } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { ConverterException } from '@org-quicko/core';

export interface IDateWisePromoterAnalyticsData {
	date: string;
	signups: number;
	purchases: number;
	revenue: number;
	commission: number;
	signupCommission: number;
	purchaseCommission: number;
}

export class DateWisePromoterAnalyticsTableConverter {
	convertFrom(
		dateWiseData: IDateWisePromoterAnalyticsData[]
	) {
		try {
			const table = new DateWisePromoterAnalyticsTable();

			dateWiseData.forEach((data) => {
				const row = new DateWisePromoterAnalyticsRow([]);

				row.setDate(data.date);
				row.setSignups(Number(data.signups));
				row.setPurchases(Number(data.purchases));
				row.setRevenue(Number(data.revenue));
				row.setCommission(Number(data.commission));
				row.setSignupCommission(Number(data.signupCommission));
				row.setPurchaseCommission(Number(data.purchaseCommission));
				table.addRow(row);
			});

			return table;

		} catch (error) {
			throw new ConverterException('Failed to convert to DateWise Promoter Analytics Table', error);
		}
	}
}
