
import { Injectable } from '@nestjs/common';
import { ProgramAnalyticsSheet, ProgramAnalyticsWorkbook, ProgramAnalyticsTable, ProgramAnalyticsRow } from '@org-quicko/cliq-sheet-core/ProgramAnalytics/beans';
import { LoggerService } from '../../services/logger.service';
import { ConverterException } from '@org-quicko/core';

export interface ITopPromoterBySignups {
    promoterId: string;
    promoterName: string;
    signups: number;
    signupCommission: number;
}

export interface ITopPromoterByPurchases {
    promoterId: string;
    promoterName: string;
    purchases: number;
    revenue: number;
    purchaseCommission: number;
}

export interface IProgramAnalyticsConverterInput {
    totalRevenue: number;
    totalCommissions: number;
    totalSignups: number;
    totalPurchases: number;
    period?: string;
    topPromotersBySignups?: ITopPromoterBySignups[];
    topPromotersByPurchases?: ITopPromoterByPurchases[];
}
@Injectable()
export class ProgramAnalyticsConverter {
    constructor(
        private logger: LoggerService,
    ) { }
    convert(data: IProgramAnalyticsConverterInput): ProgramAnalyticsWorkbook {
        try {
            this.logger.info('START: convert function: ProgramAnalyticsConverter');
            console.log('=== CONVERTER INPUT ===', data);
           
            const programAnalyticsWorkbook = new ProgramAnalyticsWorkbook();
            console.log('Created workbook:', programAnalyticsWorkbook.constructor.name);
          
            const analyticsSheet = new ProgramAnalyticsSheet();
            
            const analyticsTable = new ProgramAnalyticsTable();
            
            const analyticsRow = new ProgramAnalyticsRow([
                data.totalRevenue,
                data.totalCommissions,
                data.totalSignups,
                data.totalPurchases
            ]);
            
            analyticsTable.addRow(analyticsRow);
            
            analyticsSheet.addProgramAnalyticsTable(analyticsTable);
         
            programAnalyticsWorkbook.addProgramAnalyticsSheet(analyticsSheet);
            
            console.log('=== CONVERTER OUTPUT ===');
            console.log('Type:', typeof programAnalyticsWorkbook);
            console.log('Constructor:', programAnalyticsWorkbook.constructor.name);
            console.log('Workbook:', JSON.stringify(programAnalyticsWorkbook, null, 2));
            console.log('========================');
            
            this.logger.info('END: convert function: ProgramAnalyticsConverter');
            return programAnalyticsWorkbook;
        } catch (error) {
            this.logger.error('Error in ProgramAnalyticsConverter:', error);
            throw new ConverterException('Error converting analytics data to ProgramAnalyticsWorkbook', error);
        }
    }

}