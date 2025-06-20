import { ProgramSummaryList } from "@org-quicko/cliq-sheet-core/Program/beans";
import { formatDate } from "../../utils";
import { conversionTypeEnum, dateFormatEnum } from "../../enums";
import { Commission, Program, Purchase, SignUp } from "../../entities";
import { ConverterException } from "@org-quicko/core";

export interface IProgramSummaryListConverterInput {
	startDate: Date;
	endDate: Date;
	programId: string;
	numPromoters: number;
	program: Program | null;
	signUps: SignUp[];
	purchases: Purchase[];
	commissions: Commission[];
	dateFormat: dateFormatEnum;
}

export class ProgramSummaryListConverter {
	convertFrom({
		startDate,
		endDate,
		programId,
		numPromoters,
		program,
		signUps,
		purchases,
		commissions,
		dateFormat,
	}: IProgramSummaryListConverterInput) {
		try {
			const programSummaryList = new ProgramSummaryList();

			const totalSignUps = signUps.length;
			const totalPurchases = purchases.length;
			let totalRevenue = 0;
			let totalPurchasesCommission = 0;
			let totalSignUpsCommission = 0;

			const totalPromoters = numPromoters;
			if (program) {
				commissions.forEach(commission => {
					if (commission.conversionType === conversionTypeEnum.SIGNUP) {
						totalSignUpsCommission += commission.amount;
					}
					else if (commission.conversionType === conversionTypeEnum.PURCHASE) {
						totalPurchasesCommission += commission.amount;
					}
				})

				purchases.forEach(purchase => {
					totalRevenue += purchase.amount;
				});
			}

			programSummaryList.addFrom(formatDate(startDate, dateFormat));
			programSummaryList.addTo(formatDate(endDate, dateFormat));
			programSummaryList.addPromoters(totalPromoters)
			programSummaryList.addProgramId(programId);
			programSummaryList.addSignups(totalSignUps);
			programSummaryList.addCommissionOnSignups(totalSignUpsCommission);
			programSummaryList.addPurchases(totalPurchases);
			programSummaryList.addCommissionOnPurchases(totalPurchasesCommission);
			programSummaryList.addRevenue(totalRevenue);
			programSummaryList.addTotalCommission(totalSignUpsCommission + totalPurchasesCommission);

			return programSummaryList;

		} catch (error) {
			throw new ConverterException('Failed to convert to ProgramSummaryList', error);
		}
	}
}