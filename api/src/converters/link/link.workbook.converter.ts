import { LinkSheet, LinkSummarySheet, LinkWorkbook } from "@org-quicko/cliq-sheet-core/Link/beans";
import { Link } from "../../entities";
import { LinkTableConverter } from "./link.table.converter";
import { LinkSummaryListConverter } from "./link_summary.list.converter";
import { ConverterException } from "@org-quicko/core";

export class LinkWorkbookConverter {

	private linkTableConverter: LinkTableConverter;

	private linkSummaryListConverter: LinkSummaryListConverter;
	
	constructor() {
		this.linkTableConverter = new LinkTableConverter();
		this.linkSummaryListConverter = new LinkSummaryListConverter();
	}

	/** For getting link report inside Link Workbook */
	convertFrom(
		links: Link[],
		startDate: Date,
		endDate: Date,
	): LinkWorkbook {
		try {
			const linkWorkbook = new LinkWorkbook();
			
			// LINK SUMMARY SHEET
			const linksSummarySheet = new LinkSummarySheet();
			const linkSummaryList = this.linkSummaryListConverter.convertFrom({
				links,
				startDate,
				endDate,
			});
			linksSummarySheet.replaceBlock(linkSummaryList);

			// LINK SHEET
			const linksSheet = new LinkSheet();
			const linkTable = this.linkTableConverter.convertFrom(
				links,
			);
			linksSheet.replaceBlock(linkTable);

			
	   		// Replace existing blank sheets 
			   linkWorkbook.replaceSheet(linksSummarySheet);
			linkWorkbook.replaceSheet(linksSheet);

			return linkWorkbook;
		} catch (error) {
			throw new ConverterException('Failed to convert to Link Workbook: ', error);
		}
	}
}