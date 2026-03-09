import { Injectable } from '@nestjs/common';
import { ProgramAnalyticsWorkbook } from '@org-quicko/cliq-sheet-core/ProgramAnalytics/beans';
import { ConverterException } from '@org-quicko/core';
import { ProgramAnalyticsSheetConverter, IProgramAnalyticsSheetConverterInput } from './program_analytics.sheet.converter';

export interface IProgramAnalyticsWorkbookConverterInput {
    programAnalyticsSheetInput?: IProgramAnalyticsSheetConverterInput;
}

@Injectable()
export class ProgramAnalyticsWorkbookConverter {

    private programAnalyticsSheetConverter: ProgramAnalyticsSheetConverter;

    constructor() {
        this.programAnalyticsSheetConverter = new ProgramAnalyticsSheetConverter();
    }

    convertTo({
        programAnalyticsSheetInput,
    }: IProgramAnalyticsWorkbookConverterInput) {
        try {
            const workbook = new ProgramAnalyticsWorkbook();

            if (programAnalyticsSheetInput) {
                const sheet = this.programAnalyticsSheetConverter.convertFrom(programAnalyticsSheetInput);
                workbook.replaceSheet(sheet);
            }

            return workbook;

        } catch (error) {
            throw new ConverterException('Failed to convert to Program Analytics Workbook', error);
        }
    }
}