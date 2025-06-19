import { Purchase } from "../../entities";
import { PurchaseSheet } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { PurchaseTableConverter } from "./purchase.table.converter";
import { ConverterException } from '@org-quicko/core';

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
		{
			purchases
		}: IPurchaseSheetConverterInput
	) {
		try {
			const purchaseSheet = new PurchaseSheet();

			const purchaseTable = this.purchaseTableConverter.convertFrom(purchases);
			purchaseSheet.replaceBlock(purchaseTable);

			return purchaseSheet;
			
		} catch (error) {
			throw new ConverterException('Failed to convert to Purchase Sheet', error);
		}
	}
}