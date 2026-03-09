import { ProgramAnalyticsSheet } from "@org-quicko/cliq-sheet-core/ProgramAnalytics/beans";
import { ProgramAnalyticsTableConverter, IProgramAnalyticsInput } from "./program_analytics.table.converter";
import { DateWiseProgramAnalyticsTableConverter, IDateWiseProgramAnalyticsData } from "./date_wise_program_analytics.table.converter";
import { ConverterException, JSONObject } from '@org-quicko/core';

export interface IProgramAnalyticsSheetConverterInput {
	programAnalytics: IProgramAnalyticsInput[];
	dateWiseData?: IDateWiseProgramAnalyticsData[];
	period?: string;
}

export class ProgramAnalyticsSheetConverter {

	private programAnalyticsTableConverter: ProgramAnalyticsTableConverter;
	private dateWiseProgramAnalyticsTableConverter: DateWiseProgramAnalyticsTableConverter;

	constructor() {
		this.programAnalyticsTableConverter = new ProgramAnalyticsTableConverter();
		this.dateWiseProgramAnalyticsTableConverter = new DateWiseProgramAnalyticsTableConverter();
	}

	convertFrom({
		programAnalytics,
		dateWiseData,
		period,
	}: IProgramAnalyticsSheetConverterInput) {
		try {
			const programAnalyticsSheet = new ProgramAnalyticsSheet();

			const programAnalyticsTable = this.programAnalyticsTableConverter.convertFrom(programAnalytics);
			if (period) {
				programAnalyticsTable.setMetadata(new JSONObject({ period }));
			}
			programAnalyticsSheet.replaceBlock(programAnalyticsTable);

			if (dateWiseData) {
				const dateWiseTable = this.dateWiseProgramAnalyticsTableConverter.convertFrom(dateWiseData);
				programAnalyticsSheet.replaceBlock(dateWiseTable);
			}

			return programAnalyticsSheet;

		} catch (error) {
			throw new ConverterException('Failed to convert to Program Analytics Sheet', error);
		}
	}
}
