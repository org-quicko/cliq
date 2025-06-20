import { Commission, Program, Purchase, SignUp } from "../../entities";
import { ProgramSummarySheet, ProgramWorkbook, PromoterSheet } from "@org-quicko/cliq-sheet-core/Program/beans";
import { PromoterTableConverter } from "./promoter.table.converter";
import { dateFormatEnum } from "../../enums";
import { ProgramSummaryListConverter } from "./program_summary.list.converter";
import { ConverterException } from "@org-quicko/core";

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
		numPromoters: number,
		program: Program | null,
		signUps: SignUp[],
		purchases: Purchase[],
		commissions: Commission[],
		promoterSignUpsMap: Map<string, SignUp[]>,
		promoterPurchasesMap: Map<string, Purchase[]>,
		promoterCommissionsMap: Map<string, Commission[]>,
		startDate: Date,
		endDate: Date,
	): ProgramWorkbook {
		try {
			const programWorkbook = new ProgramWorkbook();
	
			//  PROGRAM SUMMARY SHEET
			const dateFormat = program?.dateFormat ?? dateFormatEnum.DD_MM_YYYY;
			const programSummarySheet = new ProgramSummarySheet();
			const programSummaryList = this.programSummaryListConverter.convertFrom({
				startDate,
				endDate,
				programId,
				numPromoters,
				program,
				signUps,
				purchases,
				commissions,
				dateFormat,
			});
			programSummarySheet.replaceBlock(programSummaryList);

			// PROMOTER SHEET
			const promoterSheet = new PromoterSheet();
			const promoterTable = this.promoterTableConverter.convertFrom(
				program,
				promoterSignUpsMap,
				promoterPurchasesMap,
				promoterCommissionsMap,
			);
			promoterSheet.replaceBlock(promoterTable);
	
	   		// Replace existing blank sheets 
			   programWorkbook.replaceSheet(programSummarySheet);
			programWorkbook.replaceSheet(promoterSheet);

			return programWorkbook;
			
		} catch (error) {
			throw new ConverterException('Failed to convert to Program Workbook', error);
		}

	}
}