import { PromoterAnalyticsSheet } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { PromoterAnalyticsTableConverter, IPromoterAnalyticsInput } from "./promoter_analytics.table.converter";
import { DateWisePromoterAnalyticsTableConverter, IDateWisePromoterAnalyticsData } from "./date_wise_promoter_analytics.table.converter";
import { ConverterException } from '@org-quicko/core';

export interface IPromoterAnalyticsSheetConverterInput {
	promoterAnalytics: IPromoterAnalyticsInput[];
	dateWiseData?: IDateWisePromoterAnalyticsData[];
};

export class PromoterAnalyticsSheetConverter {

	private promoterAnalyticsTableConverter: PromoterAnalyticsTableConverter;
	private dateWisePromoterAnalyticsTableConverter: DateWisePromoterAnalyticsTableConverter;

	constructor() {
		this.promoterAnalyticsTableConverter = new PromoterAnalyticsTableConverter();
		this.dateWisePromoterAnalyticsTableConverter = new DateWisePromoterAnalyticsTableConverter();
	}

	convertFrom(
		{
			promoterAnalytics,
			dateWiseData,
		}: IPromoterAnalyticsSheetConverterInput
	) {
		try {
			const promoterAnalyticsSheet = new PromoterAnalyticsSheet();

			const promoterAnalyticsTable = this.promoterAnalyticsTableConverter.convertFrom(promoterAnalytics);
			promoterAnalyticsSheet.replaceBlock(promoterAnalyticsTable);

			if (dateWiseData) {
				const dateWiseTable = this.dateWisePromoterAnalyticsTableConverter.convertFrom(dateWiseData);
				promoterAnalyticsSheet.replaceBlock(dateWiseTable);
			}

			return promoterAnalyticsSheet;
			
		} catch (error) {
			throw new ConverterException('Failed to convert to Promoter Analytics Sheet', error);
		}
	}
}