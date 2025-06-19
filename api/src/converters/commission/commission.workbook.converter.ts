import { Commission, Promoter, Purchase, SignUp } from '../../entities';
import { CommissionSummarySheet, CommissionWorkbook, PurchaseSheet, SignupSheet } from "@org-quicko/cliq-sheet-core/Commission/beans";
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

			// COMMISSION SUMMARY SHEET
			const commissionSummarySheet = new CommissionSummarySheet();
			const commissionsSummaryList = this.commissionsSummaryListConverter.convertFrom({
				startDate,
				endDate,
				promoterId: promoter.promoterId,
				promoterName: promoter.name,
				signUpsCommissions,
				purchasesCommissions,
				signUps,
				purchases
			});
			commissionSummarySheet.replaceBlock(commissionsSummaryList);

			// SIGNUPS SHEET
			const signUpsSheet = new SignupSheet();
			const signUpsTable = this.signUpTableConverter.convertTo(
				signUpsCommissions,
				signUps,
			);
			signUpsSheet.replaceBlock(signUpsTable);

			// PURCHASES SHEET
			const purchasesSheet = new PurchaseSheet();
			const purchasesTable = this.purchaseTableConverter.convertFrom(
				purchasesCommissions,
				purchases
			);
			purchasesSheet.replaceBlock(purchasesTable);


			// Replace existing blank sheets 
			commissionWorkbook.replaceSheet(commissionSummarySheet);
			commissionWorkbook.replaceSheet(signUpsSheet);
			commissionWorkbook.replaceSheet(purchasesSheet);

			return commissionWorkbook;
		} catch (error) {
			throw new ConverterException('Failed to convert to CommissionWorkbook', error);
		}

	}
}
