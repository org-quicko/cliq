import { PromoterAnalyticsView } from "../../entities";
import { PromoterAnalyticsSheet } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { PromoterAnalyticsTableConverter } from "./promoter_analytics.table.converter";
import { ConverterException } from '@org-quicko/core';

export interface IPromoterAnalyticsSheetConverterInput {
	promoterAnalytics: PromoterAnalyticsView[];
};

export class PromoterAnalyticsSheetConverter {

	private promoterAnalyticsTableConverter: PromoterAnalyticsTableConverter;

	constructor() {
		this.promoterAnalyticsTableConverter = new PromoterAnalyticsTableConverter();
	}

	convertFrom(
		{
			promoterAnalytics
		}: IPromoterAnalyticsSheetConverterInput
	) {
		try {
			const promoterAnalyticsSheet = new PromoterAnalyticsSheet();

			const promoterAnalyticsTable = this.promoterAnalyticsTableConverter.convertFrom(promoterAnalytics);
			promoterAnalyticsSheet.replaceBlock(promoterAnalyticsTable);

			return promoterAnalyticsSheet;
			
		} catch (error) {
			throw new ConverterException('Failed to convert to Promoter Analytics Sheet', error);
		}
	}
}