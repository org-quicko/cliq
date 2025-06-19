import { Commission, Promoter, SignUp } from "../../entities";
import { SignupSheet, SignupSummarySheet, SignUpWorkbook } from "@org-quicko/cliq-sheet-core/SignUp/beans";
import { SignUpTableConverter } from "./signup.table.converter";
import { SignUpSummaryListConverter } from "./signup_summary.list.converter";
import { ConverterException } from '@org-quicko/core';

export class SignUpWorkbookConverter {

	private signUpTableConverter: SignUpTableConverter;

	private signUpSummaryListConverter: SignUpSummaryListConverter;

	constructor() {
		this.signUpTableConverter = new SignUpTableConverter();
		this.signUpSummaryListConverter = new SignUpSummaryListConverter();
	}

	/** For getting signups report for the promoter */
	convertFrom(
		signUps: SignUp[],
		signUpsCommissions: Map<string, Commission>,
		promoter: Promoter,
		startDate: Date,
		endDate: Date,
	): SignUpWorkbook {
		try {
			const signUpWorkbook = new SignUpWorkbook();
			
			// SIGNUPS SUMMARY SHEET
			const signUpSummarySheet = new SignupSummarySheet();
			const signUpsSummaryList = this.signUpSummaryListConverter.convertFrom({
				startDate,
				endDate,
				promoterId: promoter.promoterId,
				promoterName: promoter.name,
				signUps,
				signUpsCommissions,
			});
			signUpSummarySheet.replaceBlock(signUpsSummaryList);

			// SIGNUPS SHEET
			const signupsSheet = new SignupSheet();
			const signupsTable = this.signUpTableConverter.convertFrom(
				signUpsCommissions,
				signUps
			);
			signupsSheet.replaceBlock(signupsTable);

			// Replace existing blank sheets 
			signUpWorkbook.replaceSheet(signUpSummarySheet);
			signUpWorkbook.replaceSheet(signupsSheet);

			return signUpWorkbook;
		} catch (error) {
			throw new ConverterException('Failed to convert to Signup Workbook', error);
		}
	}
}