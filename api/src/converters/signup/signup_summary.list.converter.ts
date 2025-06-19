import { SignupSummaryList } from "@org-quicko/cliq-sheet-core/SignUp/beans";
import { formatDate } from "../../utils";
import { Commission, SignUp } from "../../entities";
import { ConverterException } from '@org-quicko/core';

export interface ISignUpSummaryListConverterInput {
	startDate: Date,
	endDate: Date,
	promoterId: string,
	promoterName: string,
	signUps: SignUp[],
	signUpsCommissions: Map<string, Commission>,
}

export class SignUpSummaryListConverter {
	convertFrom({
		startDate,
		endDate,
		promoterId,
		promoterName,
		signUps,
		signUpsCommissions,
	}: ISignUpSummaryListConverterInput) {
		try {
			const signUpsSummaryList = new SignupSummaryList();

			const totalSignUps = signUps.length;
			const totalCommission = signUps.reduce((acc, signUp) => {
				const commission = signUpsCommissions.get(signUp.contactId);
				return acc + (commission?.amount ?? 0);
			}, 0);

			signUpsSummaryList.addFrom(formatDate(startDate));
			signUpsSummaryList.addTo(formatDate(endDate));
			signUpsSummaryList.addPromoterId(promoterId);
			signUpsSummaryList.addPromoterName(promoterName);
			signUpsSummaryList.addSignups(totalSignUps);
			signUpsSummaryList.addTotalCommission(totalCommission);

			return signUpsSummaryList;
			
		} catch (error) {
			throw new ConverterException('Failed to convert to Signup Summary List', error);
		}
	}
}