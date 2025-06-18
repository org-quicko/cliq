import { Commission, Promoter, Purchase, SignUp } from '../../entities';
import { CommissionWorkbook } from "@org-quicko/cliq-sheet-core/Commission/beans";
import { PurchaseTableConverter } from './purchase.table.converter';
import { SignUpTableConverter } from './signup.table.converter';
import { CommissionSummaryListConverter } from './commission_summary.list.converter';
import { ConverterException } from '@org-quicko/core';

export class CommissionWorkbookConverter {	
	private purchaseTableConverter: PurchaseTableConverter;

	private signUpTableConverter: SignUpTableConverter;

	private commissionsSummaryListConverter: CommissionSummaryListConverter;
	
	constructor() {
		this.purchaseTableConverter = new PurchaseTableConverter();
		this.signUpTableConverter = new SignUpTableConverter();
		this.commissionsSummaryListConverter = new CommissionSummaryListConverter();
	}

	/** For getting commissions report for the promoter */
	convertFrom(
		signUps: SignUp[],
		purchases: Purchase[],
		signUpsCommissions: Map<string, Commission>,
		purchasesCommissions: Map<string, Commission[]>,
		promoter: Promoter,
		startDate: Date,
		endDate: Date,
	): CommissionWorkbook {
		try {
			const commissionWorkbook = new CommissionWorkbook();
	
			// PURCHASES SHEET
			const purchasesSheet = commissionWorkbook.getPurchaseSheet();
	
			this.purchaseTableConverter.convertFrom(
				purchasesSheet.getPurchaseTable(),
				purchasesCommissions,
				purchases
			);
	
			// SIGNUPS SHEET
			const signUpsSheet = commissionWorkbook.getSignupSheet();
	
			this.signUpTableConverter.convertTo(
				signUpsSheet.getSignupTable(),
				signUpsCommissions,
				signUps,
			);
	
			// COMMISSION SUMMARY SHEET
			this.commissionsSummaryListConverter.convertFrom({
				commissionsSummaryList: commissionWorkbook.getCommissionSummarySheet().getCommissionSummaryList(),
				startDate,
				endDate,
				promoterId: promoter.promoterId,
				promoterName: promoter.name,
				signUpsCommissions,
				purchasesCommissions,
				signUps,
				purchases
			});
	
			return commissionWorkbook;
		} catch (error) {
			throw new ConverterException('Failed to convert to CommissionWorkbook', error);
		}

	}
}
