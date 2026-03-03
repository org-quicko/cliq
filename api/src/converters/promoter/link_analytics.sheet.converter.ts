import { LinkAnalyticsView } from "../../entities";
import { LinkAnalyticsSheet } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { LinkAnalyticsTableConverter } from "./link_analytics.table.converter";
import { ConverterException } from "@org-quicko/core";

export interface ILinkAnalyticsSheetConverterInput {
	linkAnalytics: LinkAnalyticsView[];
	metadata: {
		website: string;
		programId: string;
		period?: string;
		startDate?: string;
		endDate?: string;
		count: number;
		skip?: number;
		take?: number;
		hasMore?: boolean;
	};
};

export class LinkAnalyticsSheetConverter {

	private linkAnalyticsTableConverter: LinkAnalyticsTableConverter;

	constructor() {
		this.linkAnalyticsTableConverter = new LinkAnalyticsTableConverter();
	}

	/** For getting link statistics sheet inside a Promoter Workbook */
	convertFrom(
		{
			linkAnalytics,
			metadata
		}: ILinkAnalyticsSheetConverterInput
	) {

		try {
			const linkAnalyticsSheet = new LinkAnalyticsSheet();

			const linkAnalyticsTable = this.linkAnalyticsTableConverter.convertFrom(
				linkAnalytics,
				metadata
			);
			linkAnalyticsSheet.replaceBlock(linkAnalyticsTable);

			return linkAnalyticsSheet;

		} catch (error) {
			throw new ConverterException('Failed to convert to LinkAnalyticsSheet', error);
		}
	}
}