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
		promoterAnalyticsSheet: PromoterAnalyticsSheet,
		{
			promoterAnalytics
		}: IPromoterAnalyticsSheetConverterInput
	) {
		try {
			this.promoterAnalyticsTableConverter.convertFrom(
				promoterAnalyticsSheet.getPromoterAnalyticsTable(),
				promoterAnalytics
			);
		} catch (error) {
			throw new ConverterException('Failed to convert to Promoter Analytics Sheet', error);
		}
	}
}