import { Commission } from "../../entities";
import { referralKeyTypeEnum } from "../../enums";
import { CommissionSheet } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { CommissionTableConverter } from "./commission.table.converter";
import { ConverterException } from "@org-quicko/core";

export interface ICommissionSheetConverterInput {
	commissions: Commission[];
	referralKeyType: referralKeyTypeEnum;
	metadata: { count: number };
};

export class CommissionSheetConverter {

	private commissionTableConverter: CommissionTableConverter;

	constructor() {
		this.commissionTableConverter = new CommissionTableConverter();
	}

	/** For getting commissions data for the promoter */
	convertFrom(
		{
			commissions, 
			referralKeyType, 
			metadata
		}: ICommissionSheetConverterInput
	) {
		try {
			const commissionSheet = new CommissionSheet();

			const commissionTable = this.commissionTableConverter.convertFrom(
				commissions,
				referralKeyType,
				metadata
			);
			commissionSheet.replaceBlock(commissionTable);

			return commissionSheet;
			
		} catch (error) {
			throw new ConverterException('Failed to convert to Commission Sheet', error);			
		}
	}
}