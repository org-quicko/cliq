import { Program } from "../../entities";
import { ProgramWorkbook } from "@org-quicko/cliq-sheet-core/Program/beans";
import { PromoterTableConverter } from "./promoter.table.converter";
import { conversionTypeEnum, dateFormatEnum } from "../../enums";
import { ProgramSummaryListConverter } from "./program_summary.list.converter";

export class ProgramWorkbookConverter {

	private promoterTableConverter: PromoterTableConverter;
	
	private programSummaryListConverter: ProgramSummaryListConverter;

	constructor() {
		this.promoterTableConverter = new PromoterTableConverter();
		this.programSummaryListConverter = new ProgramSummaryListConverter();
	}

	/** For getting promoters report for a program */
	convertFrom(
		programId: string,
		program: Program | null,
		startDate: Date,
		endDate: Date,
	): ProgramWorkbook {
		const programWorkbook = new ProgramWorkbook();

		const promotersSheet = programWorkbook.getPromoterSheet();
		const promotersTable = promotersSheet.getPromoterTable();

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

		this.promoterTableConverter.convertFrom(
			promotersTable,
			program,
		);

		const dateFormat = program?.dateFormat ?? dateFormatEnum.DD_MM_YYYY;

		this.programSummaryListConverter.convertFrom({
			programSummaryList: programWorkbook.getProgramSummarySheet().getProgramSummaryList(),
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
		});

		return programWorkbook;

	}
}