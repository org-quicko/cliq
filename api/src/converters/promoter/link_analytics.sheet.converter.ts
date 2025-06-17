import { LinkAnalyticsView } from "src/entities";
import { LinkAnalyticsSheet } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { LinkAnalyticsTableConverter } from "./link_analytics.table.converter";

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
		this.linkAnalyticsTableConverter.convertFrom(
			linkAnalyticsSheet.getLinkAnalyticsTable(),
			linkAnalytics,
			metadata
		)
	}
}