import { ProgramAnalyticsRow, ProgramAnalyticsTable } from "@org-quicko/cliq-sheet-core/ProgramAnalytics/beans";
import { ConverterException } from '@org-quicko/core';

export interface IProgramAnalyticsInput {
	totalRevenue: number;
	totalCommissions: number;
	totalSignups: number;
	totalPurchases: number;
}

export class ProgramAnalyticsTableConverter {
	convertFrom(programAnalytics: IProgramAnalyticsInput[]) {
		try {
			const table = new ProgramAnalyticsTable();

			programAnalytics.forEach((data) => {
				const row = new ProgramAnalyticsRow([]);

				row.setTotalRevenue(Number(data.totalRevenue));
				row.setTotalCommissions(Number(data.totalCommissions));
				row.setTotalSignups(Number(data.totalSignups));
				row.setTotalPurchases(Number(data.totalPurchases));

				table.addRow(row);
			});

			return table;

		} catch (error) {
			throw new ConverterException('Failed to convert to Program Analytics Table', error);
		}
	}
}
