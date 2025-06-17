import { ProgramSummaryList } from "@org-quicko/cliq-sheet-core/Program/beans";
import { formatDate } from "../../utils";
import { dateFormatEnum } from "../../enums";

export interface ProgramSummaryListConverterInputInterface {
	programSummaryList: ProgramSummaryList;
	startDate: Date;
	endDate: Date;
	totalPromoters: number;
	programId: string;
	totalSignUps: number;
	totalSignUpsCommission: number;
	totalPurchases: number;
	totalPurchasesCommission: number;
	totalRevenue: number;
	dateFormat: dateFormatEnum;
}

export class ProgramSummaryListConverter {
	convertFrom({
		programSummaryList,
		startDate,
		endDate,
		totalPromoters,
		programId,
		totalSignUps,
		totalSignUpsCommission,
		totalPurchases,
		totalPurchasesCommission,
		totalRevenue,
		dateFormat,
	}: ProgramSummaryListConverterInputInterface) {

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
	}
}