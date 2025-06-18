import { LinkSheet, LinkWorkbook } from "@org-quicko/cliq-sheet-core/Link/beans";
import { Link } from "../../entities";
import { LinkTableConverter } from "./link.table.converter";
import { LinkSummaryListConverter } from "./link_summary.list.converter";
import { ConverterException } from "@org-quicko/core";

export class LinkWorkbookConverter {

	private linkTableConverter: LinkTableConverter;

	private linkSummaryListConverter: LinkSummaryListConverter;
	
	constructor() {
		this.linkTableConverter = new LinkTableConverter();
	}

	/** For getting link report inside Link Workbook */
	convertFrom(
		links: Link[],
		startDate: Date,
		endDate: Date,
	): LinkWorkbook {
		try {
			const linkWorkbook = new LinkWorkbook();
			const linksSheet = linkWorkbook.getLinkSheet();
			const linksTable = linksSheet.getLinkTable();
			linkWorkbook.replaceSheet(linksSheet);

			this.linkTableConverter.convertFrom(
				linksTable,
				links,
			);

			this.linkSummaryListConverter.convertFrom({
				linksSummaryList: linkWorkbook.getLinkSummarySheet().getLinkSummaryList(),
				links,
				startDate,
				endDate,
			});
			

			return linkWorkbook;
		} catch (error) {
			throw new ConverterException('Failed to convert to Link Workbook: ', error);
		}
	}
}