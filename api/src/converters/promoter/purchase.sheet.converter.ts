import { Purchase } from "src/entities";
import { PurchaseSheet } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { PurchaseTableConverter } from "./purchase.table.converter";

export interface IPurchaseSheetConverterInput {
	purchases: Purchase[];
};

export class PurchaseSheetConverter {

	private purchaseTableConverter: PurchaseTableConverter;

	constructor() {
		this.purchaseTableConverter = new PurchaseTableConverter();
	}

	/** For getting purchases data for the promoter */
	convertFrom(
		purchaseSheet: PurchaseSheet, 
		{
			purchases
		}: IPurchaseSheetConverterInput
	) {
		this.purchaseTableConverter.convertFrom(
			purchaseSheet.getPurchaseTable(),
			purchases
		);
	}
}