import { DateWiseProgramAnalyticsRow, DateWiseProgramAnalyticsTable } from "@org-quicko/cliq-sheet-core/ProgramAnalytics/beans";
import { ConverterException } from '@org-quicko/core';

export interface IDateWiseProgramAnalyticsData {
	date: string;
	signups: number;
	purchases: number;
	revenue: number;
	commission: number;
	signupCommission: number;
	purchaseCommission: number;
}

export class DateWiseProgramAnalyticsTableConverter {
	convertFrom(dateWiseData: IDateWiseProgramAnalyticsData[]) {
		try {
			const table = new DateWiseProgramAnalyticsTable();

			dateWiseData.forEach((data) => {
				const row = new DateWiseProgramAnalyticsRow([]);

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
			throw new ConverterException('Failed to convert to DateWise Program Analytics Table', error);
		}
	}
}
