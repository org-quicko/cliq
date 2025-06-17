import { Commission, Promoter, SignUp } from "src/entities";
import { SignUpWorkbook } from "@org-quicko/cliq-sheet-core/SignUp/beans";
import { SignUpTableConverter } from "./signup.table.converter";
import { SignUpSummaryListConverter } from "./signup_summary.list.converter";

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
		const signUpWorkbook = new SignUpWorkbook();

		const signupsSheet = signUpWorkbook.getSignupSheet();
		const signupsTable = signupsSheet.getSignupTable();
		const totalSignUps = signUps.length;
		
		const totalCommission = signUps.reduce((acc, signUp) => {
			const commission = signUpsCommissions.get(signUp.contactId);
			return acc + (commission?.amount ?? 0);
		}, 0);


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
			totalSignUps,
			totalCommission,
		})

		return signUpWorkbook;

	}
}