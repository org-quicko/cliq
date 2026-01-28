import { Injectable } from '@nestjs/common';
import { ProgramAnalyticsSheet, ProgramAnalyticsWorkbook, ProgramAnalyticsTable, ProgramAnalyticsRow } from '@org-quicko/cliq-sheet-core/ProgramAnalytics/beans';
import { LoggerService } from '../../services/logger.service';
import { ConverterException } from '@org-quicko/core';

export interface IProgramAnalyticsConverterInput {
    totalRevenue: number;
    totalCommissions: number;
    totalSignups: number;
    totalPurchases: number;
    period?: string;
}
@Injectable()
export class ProgramAnalyticsConverter {
    constructor(
        private logger: LoggerService,
    ) { }
    
    convert(data: IProgramAnalyticsConverterInput) {
        try {
            this.logger.info('START: convert function: ProgramAnalyticsConverter');
            
          const programAnalyticsWorkbook = new ProgramAnalyticsWorkbook();


const analyticsSheet = programAnalyticsWorkbook.getProgramAnalyticsSheet();
const analyticsTable = analyticsSheet.getProgramAnalyticsTable();

const analyticsRow = new ProgramAnalyticsRow([
    data.totalRevenue,
    data.totalCommissions,
    data.totalSignups,
    data.totalPurchases
]);

analyticsTable.addRow(analyticsRow);

            analyticsSheet.addProgramAnalyticsTable(analyticsTable);
            programAnalyticsWorkbook.addProgramAnalyticsSheet(analyticsSheet);

            const result = {
                ...programAnalyticsWorkbook,
                period: data.period,
            };
            
            this.logger.info('END: convert function: ProgramAnalyticsConverter');
            return result;
        } catch (error) {
            this.logger.error('Error in ProgramAnalyticsConverter:', error);
            throw new ConverterException('Error converting analytics data', error);
        }
    }

}