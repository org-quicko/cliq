import { Injectable } from '@nestjs/common';
import { ProgramAnalyticsSheet, ProgramAnalyticsWorkbook, ProgramAnalyticsTable, ProgramAnalyticsRow, DateWiseProgramAnalyticsTable, DateWiseProgramAnalyticsRow } from '@org-quicko/cliq-sheet-core/ProgramAnalytics/beans';
import { ConverterException, JSONObject } from '@org-quicko/core';
import winston from 'winston';
import { LoggerFactory } from '@org-quicko/core';

export interface DailyAnalyticsEntry {
    date: string;
    signups: number;
    purchases: number;
    revenue: number;
    commission: number;
    signupCommission: number;
    purchaseCommission: number;
}

@Injectable()
export class ProgramAnalyticsWorkbookConverter {
    private logger : winston.Logger = LoggerFactory.getLogger(ProgramAnalyticsWorkbookConverter.name);
    constructor(
    ) { }
    
    convert(
        totalRevenue: number,
        totalCommissions: number,
        totalSignups: number,
        totalPurchases: number,
        period: string,
        dailyData: DailyAnalyticsEntry[] = [],
    ) {
        try {
            this.logger.info('START: convert function: ProgramAnalyticsWorkbookConverter');
            
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

            const dateWiseTable = new DateWiseProgramAnalyticsTable();
            for (const entry of dailyData) {
                const row = new DateWiseProgramAnalyticsRow([]);
                row.setDate(entry.date);
                row.setRevenue(entry.revenue);
                row.setPurchases(entry.purchases);
                row.setCommission(entry.commission);
                row.setSignupCommission(entry.signupCommission);
                row.setPurchaseCommission(entry.purchaseCommission);
                row.setSignups(entry.signups);
                dateWiseTable.addRow(row);
            }
            analyticsSheet.replaceBlock(dateWiseTable);

            programAnalyticsWorkbook.replaceSheet(analyticsSheet);
            
            this.logger.info('END: convert function: ProgramAnalyticsWorkbookConverter');
            return programAnalyticsWorkbook;
        } catch (error) {
            this.logger.error('Error in ProgramAnalyticsWorkbookConverter:', error);
            throw new ConverterException('Error converting analytics data', error);
        }
    }

}