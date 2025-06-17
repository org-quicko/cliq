import { Commission, Promoter, Purchase } from "src/entities";
import { PurchaseWorkbook } from "@org-quicko/cliq-sheet-core/Purchase/beans";
import { PurchaseTableConverter } from "./purchase.table.converter";
import { PurchaseSummaryListConverter } from "./purchase_summary.list.converter";

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
		const purchaseWorkbook = new PurchaseWorkbook();

		const purchasesSheet = purchaseWorkbook.getPurchaseSheet();
		const totalPurchases = purchases.length;
		
		let totalRevenue = 0;
		const totalCommission = purchases.reduce((acc, purchase) => {
			let commissionAmount = 0;

			purchasesCommissions.get(purchase.purchaseId)!.forEach((commission) => {
				commissionAmount += Number(commission.amount);
			});

			totalRevenue += purchase.amount;
			return acc + commissionAmount;

		}, 0);

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
			totalPurchases,
			totalRevenue,
			totalCommission,
		});

		return purchaseWorkbook;

	}
}