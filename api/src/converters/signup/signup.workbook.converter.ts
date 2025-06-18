import { Commission, Promoter, SignUp } from "../../entities";
import { SignUpWorkbook } from "@org-quicko/cliq-sheet-core/SignUp/beans";
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

			const signupsSheet = signUpWorkbook.getSignupSheet();
			const signupsTable = signupsSheet.getSignupTable();

			this.signUpTableConverter.convertFrom(
				signupsTable,
				signUpsCommissions,
				signUps
			)

			this.signUpSummaryListConverter.convertFrom({
				signUpsSummaryList: signUpWorkbook.getSignupSummarySheet().getSignupSummaryList(),
				startDate,
				endDate,
				promoterId: promoter.promoterId,
				promoterName: promoter.name,
				signUps,
				signUpsCommissions,
			})

			return signUpWorkbook;
		} catch (error) {
			throw new ConverterException('Failed to convert to Signup Workbook', error);
		}
	}
}