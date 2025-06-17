import { SignupSummaryList } from "@org-quicko/cliq-sheet-core/SignUp/beans";
import { formatDate } from "../../utils";

export interface SignUpSummaryListConverterInterface {
	signUpsSummaryList: SignupSummaryList, 
	startDate: Date,
	endDate: Date,
	promoterId: string,
	promoterName: string,
	totalSignUps: number,
	totalCommission: number,
}

export class SignUpSummaryListConverter {
	convertFrom({
		signUpsSummaryList,
		startDate,
		endDate,
		promoterId,
		promoterName,
		totalSignUps,
		totalCommission,
	}: SignUpSummaryListConverterInterface) {
		signUpsSummaryList.addFrom(formatDate(startDate));
		signUpsSummaryList.addTo(formatDate(endDate));
		signUpsSummaryList.addPromoterId(promoterId);
		signUpsSummaryList.addPromoterName(promoterName);
		signUpsSummaryList.addSignups(totalSignUps);
		signUpsSummaryList.addTotalCommission(totalCommission);
	}
}