import { Injectable } from '@nestjs/common';
import { ProgramAnalyticsSheet, ProgramAnalyticsWorkbook, ProgramAnalyticsTable, ProgramAnalyticsRow } from '@org-quicko/cliq-sheet-core/ProgramAnalytics/beans';
import { LoggerService } from '../../services/logger.service';
import { ConverterException, JSONObject } from '@org-quicko/core';

@Injectable()
export class ProgramAnalyticsConverter {
    constructor(
        private logger: LoggerService,
    ) { }
    
    convert(
        totalRevenue: number,
        totalCommissions: number,
        totalSignups: number,
        totalPurchases: number,
        period: string,
    ) {
        try {
            this.logger.info('START: convert function: ProgramAnalyticsConverter');
            
            const programAnalyticsWorkbook = new ProgramAnalyticsWorkbook();

            const analyticsSheet = programAnalyticsWorkbook.getProgramAnalyticsSheet();

            const analyticsTable = new ProgramAnalyticsTable();

            const analyticsRow = new ProgramAnalyticsRow([
                totalRevenue,
                totalCommissions,
                totalSignups,
                totalPurchases
            ]);

            analyticsTable.addRow(analyticsRow);
            analyticsTable.setMetadata(new JSONObject({ period }));

            analyticsSheet.replaceBlock(analyticsTable);
            programAnalyticsWorkbook.replaceSheet(analyticsSheet);
            
            this.logger.info('END: convert function: ProgramAnalyticsConverter');
            return programAnalyticsWorkbook;
        } catch (error) {
            this.logger.error('Error in ProgramAnalyticsConverter:', error);
            throw new ConverterException('Error converting analytics data', error);
        }
    }

}