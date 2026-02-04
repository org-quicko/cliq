import { ProgramSummaryViewWorkbook, ProgramSummaryViewRow } from '@org-quicko/cliq-sheet-core/ProgramSummaryView/beans';
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../services/logger.service';
import { ConverterException } from '@org-quicko/core';

export interface IProgramSummaryData {
    programId: string;
    programName: string;
    totalPromoters: number;
    totalReferrals: number;
    createdAt: Date | string;
}

export interface IProgramSummaryConverterInput {
    programs: IProgramSummaryData[];
    pagination?: {
        total: number;
        skip: number;
        take: number;
        hasMore: boolean;
    };
}

@Injectable()
export class ProgramSummaryViewConverter {
    constructor(
        private logger: LoggerService,
    ) { }

    convert(data: IProgramSummaryConverterInput) {
        try {
            this.logger.info('START: convert function: ProgramSummaryViewConverter');

            const workbook = new ProgramSummaryViewWorkbook();

            const sheet = workbook.getProgramSummaryViewSheet();
            const table = sheet.getProgramSummaryViewTable();

            for (const program of data.programs) {
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

            if (data.pagination) {
                workbook['metadata'] = {
                    pagination: data.pagination,
                };
            }

            this.logger.info('END: convert function: ProgramSummaryViewConverter');
            return workbook;

        } catch (error) {
            this.logger.error('Error in ProgramSummaryViewConverter:', error);
            throw new ConverterException('Error converting program summary data', error);
        }
    }
}