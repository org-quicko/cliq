import { PromoterAnalyticsView } from "src/entities";
import { PromoterAnalyticsSheet } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { PromoterAnalyticsTableConverter } from "./promoter_analytics.table.converter";

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
		this.promoterAnalyticsTableConverter.convertFrom(
			promoterAnalyticsSheet.getPromoterAnalyticsTable(),
			promoterAnalytics
		);
	}
}