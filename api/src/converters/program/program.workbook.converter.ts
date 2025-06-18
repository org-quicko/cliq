import { Program } from "../../entities";
import { ProgramWorkbook } from "@org-quicko/cliq-sheet-core/Program/beans";
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
		program: Program | null,
		startDate: Date,
		endDate: Date,
	): ProgramWorkbook {
		try {
			const programWorkbook = new ProgramWorkbook();
	
			const promotersSheet = programWorkbook.getPromoterSheet();
			const promotersTable = promotersSheet.getPromoterTable();
	
			this.promoterTableConverter.convertFrom(
				promotersTable,
				program,
			);
	
			const dateFormat = program?.dateFormat ?? dateFormatEnum.DD_MM_YYYY;
	
			this.programSummaryListConverter.convertFrom({
				programSummaryList: programWorkbook.getProgramSummarySheet().getProgramSummaryList(),
				startDate,
				endDate,
				programId,
				program,
				dateFormat,
			});
	
			return programWorkbook;
			
		} catch (error) {
			throw new ConverterException('Failed to convert to Program Workbook', error);
		}

	}
}