import { Commission, Promoter, Purchase } from "../../entities";
import { PurchaseWorkbook } from "@org-quicko/cliq-sheet-core/Purchase/beans";
import { PurchaseTableConverter } from "./purchase.table.converter";
import { PurchaseSummaryListConverter } from "./purchase_summary.list.converter";
import { ConverterException } from '@org-quicko/core';

export class PurchaseWorkbookConverter {
	private purchaseTableConverter: PurchaseTableConverter;

	private purchaseSummaryListConverter: PurchaseSummaryListConverter;

	constructor() {
		this.purchaseTableConverter = new PurchaseTableConverter();
		this.purchaseSummaryListConverter = new PurchaseSummaryListConverter();
	}

	/** For getting purchases report for the promoter */
	convertFrom(
		purchases: Purchase[],
		purchasesCommissions: Map<string, Commission[]>,
		promoter: Promoter,
		startDate: Date,
		endDate: Date,
	): PurchaseWorkbook {
		try {
			const purchaseWorkbook = new PurchaseWorkbook();

			const purchasesSheet = purchaseWorkbook.getPurchaseSheet();

			this.purchaseTableConverter.convertFrom(
				purchasesSheet.getPurchaseTable(),
				purchasesCommissions,
				purchases
			);


			this.purchaseSummaryListConverter.convertFrom({
				purchasesSummaryList: purchaseWorkbook.getPurchaseSummarySheet().getPurchaseSummaryList(),
				startDate,
				endDate,
				promoterId: promoter.promoterId,
				promoterName: promoter.name,
				purchases,
				purchasesCommissions
			});

			return purchaseWorkbook;
		} catch (error) {
			throw new ConverterException('Failed to convert to Purchase Workbook', error);
		}
	}
}