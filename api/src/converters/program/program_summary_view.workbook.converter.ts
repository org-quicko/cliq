import { ProgramSummaryViewWorkbook, ProgramSummaryViewRow } from '@org-quicko/cliq-sheet-core/ProgramSummaryView/beans';
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../services/logger.service';
import { ConverterException, JSONObject } from '@org-quicko/core';

@Injectable()
export class ProgramSummaryViewWorkbookConverter {
    constructor(
        private logger: LoggerService,
    ) { }

    convert(
        programs: Array<{
            programId: string;
            programName: string;
            totalPromoters: number;
            totalReferrals: number;
            createdAt: Date | string;
        }>,
        pagination: {
            skip: number;
            take: number;
        },
    ) {
        try {
            this.logger.info('START: convert function: ProgramSummaryViewWorkbookConverter');

            const workbook = new ProgramSummaryViewWorkbook();

            const sheet = workbook.getProgramSummaryViewSheet();
            const table = sheet.getProgramSummaryViewTable();

            for (const program of programs) {
                const row = new ProgramSummaryViewRow([]);

                row.setProgramId(String(program.programId));
                row.setProgramName(String(program.programName));
                row.setTotalPromoters(Number(program.totalPromoters ?? 0));
                row.setTotalReferrals(Number(program.totalReferrals ?? 0));
                row.setCreatedAt(
                    program.createdAt instanceof Date 
                        ? program.createdAt.toISOString() 
                        : String(program.createdAt ?? '')
                );

                table.addRow(row);
            }

            workbook.setMetadata(new JSONObject({ pagination }));

            this.logger.info('END: convert function: ProgramSummaryViewWorkbookConverter');
            return workbook;

        } catch (error) {
            this.logger.error('Error in ProgramSummaryViewWorkbookConverter:', error);
            throw new ConverterException('Error converting program summary data', error);
        }
    }
}