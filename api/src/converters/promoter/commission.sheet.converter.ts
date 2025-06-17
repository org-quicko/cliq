import { Commission } from "src/entities";
import { referralKeyTypeEnum } from "src/enums";
import { CommissionSheet } from "@org-quicko/cliq-sheet-core/Promoter/beans";
import { CommissionTableConverter } from "./commission.table.converter";

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
		commissionSheet: CommissionSheet,
		{
			commissions, 
			referralKeyType, 
			metadata
		}: ICommissionSheetConverterInput
	) {
		this.commissionTableConverter.convertFrom(
			commissionSheet.getCommissionTable(),
			commissions,
			referralKeyType,
			metadata
		);
	}
}