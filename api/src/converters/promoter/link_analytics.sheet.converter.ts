import { LinkAnalyticsView } from "../../entities";
import { LinkAnalyticsSheet } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { LinkAnalyticsTableConverter } from "./link_analytics.table.converter";
import { ConverterException } from "@org-quicko/core";

// make an interface for input to the convertFrom method
export interface ILinkAnalyticsSheetConverterInput {
	linkAnalytics: LinkAnalyticsView[];
	metadata: {
		website: string;
		programId: string;
		count: number;
	};
};

export class LinkAnalyticsSheetConverter {

	private linkAnalyticsTableConverter: LinkAnalyticsTableConverter;

	constructor() {
		this.linkAnalyticsTableConverter = new LinkAnalyticsTableConverter();
	}

	/** For getting link statistics sheet inside a Promoter Workbook */
	convertFrom(
		linkAnalyticsSheet: LinkAnalyticsSheet,
		{
			linkAnalytics, 
			metadata
		}: ILinkAnalyticsSheetConverterInput
	) {

		try {
			this.linkAnalyticsTableConverter.convertFrom(
				linkAnalyticsSheet.getLinkAnalyticsTable(),
				linkAnalytics,
				metadata
			)
			
		} catch (error) {
			throw new ConverterException('Failed to convert to LinkAnalyticsSheet', error);
		}
	}
}