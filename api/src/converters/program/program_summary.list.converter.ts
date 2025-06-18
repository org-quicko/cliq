import { ProgramSummaryList } from "@org-quicko/cliq-sheet-core/Program/beans";
import { formatDate } from "../../utils";
import { conversionTypeEnum, dateFormatEnum } from "../../enums";
import { Program } from "../../entities";
import { ConverterException } from "@org-quicko/core";

export interface IProgramSummaryListConverterInput {
	programSummaryList: ProgramSummaryList;
	startDate: Date;
	endDate: Date;
	programId: string;
	program: Program | null;
	dateFormat: dateFormatEnum;
}

export class ProgramSummaryListConverter {
	convertFrom({
		programSummaryList,
		startDate,
		endDate,
		programId,
		program,
		dateFormat,
	}: IProgramSummaryListConverterInput) {
		try {
			let totalPurchases = 0;
			let totalRevenue = 0;
			let totalSignUps = 0;
			let totalPurchasesCommission = 0;
			let totalSignUpsCommission = 0;

			const totalPromoters = program?.programPromoters.length ?? 0;
			if (program) {
				program.programPromoters.forEach((programPromoter) => {
					const promoter = programPromoter.promoter;

					let signUpsCommission = 0;
					let purchasesCommission = 0;
					let revenue = 0;

					const signUps = promoter.signUps.length;
					const purchases = promoter.purchases.length;
	
					promoter.commissions.forEach((commission) => {
						if (commission.conversionType === conversionTypeEnum.SIGNUP) {
							signUpsCommission += commission.amount;
							
						} else if (commission.conversionType === conversionTypeEnum.PURCHASE) {
							purchasesCommission += commission.amount;
							revenue += commission.revenue;
						}
					});
	
					totalSignUpsCommission += signUpsCommission;
					totalPurchasesCommission += purchasesCommission;
					totalSignUps += signUps;
					totalPurchases += purchases;
					totalRevenue += revenue;
				})
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

		} catch (error) {
			throw new ConverterException('Failed to convert to ProgramSummaryList', error);
		}
	}
}