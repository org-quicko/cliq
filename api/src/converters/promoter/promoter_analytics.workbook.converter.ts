import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../services/logger.service';
import { ConverterException } from '@org-quicko/core';
import { PromotersAnalyticsWorkbook, PromoterAnalyticsRow } from '@org-quicko/cliq-sheet-core/PromoterAnalytics/beans';


export interface IPromoterAnalyticsData {
    promoterId: string;
    promoterName: string;
    signups: number;
    purchases: number;
    revenue: number;
    commission: number;
}

export interface IPromoterAnalyticsConverterInput {
    programId: string;
    promoters: IPromoterAnalyticsData[];
    pagination: {
        total: number;
        skip: number;
        take: number;
        hasMore: boolean;
    };
    sortBy: string;
    period: string;
}

@Injectable()
export class PromoterAnalyticsConverter {
    constructor(
        private logger: LoggerService,
    ) { }
    
    convert(data: IPromoterAnalyticsConverterInput) {
    try {
        this.logger.info('START: convert function: PromoterAnalyticsConverter');

        const workbook = new PromotersAnalyticsWorkbook();


        const sheet = workbook.getPromoterAnalyticsSheet();
        const table = sheet.getPromoterAnalyticsTable();

        for (const promoter of data.promoters) {
            const row = new PromoterAnalyticsRow([]);

                        row.setProgramId(String(data.programId));
                        row.setPromoterId(String(promoter.promoterId));
                        row.setPromoterName(String(promoter.promoterName));
                        row.setTotalSignups(Number(promoter.signups ?? 0));
                        row.setTotalPurchases(Number(promoter.purchases ?? 0));
                        row.setTotalRevenue(Number(promoter.revenue ?? 0));
                        row.setTotalCommission(Number(promoter.commission ?? 0));
            table.addRow(row);
        }


        workbook['metadata'] = {
            sortBy: data.sortBy,
            period: data.period,
            pagination: data.pagination,
        };

        this.logger.info('END: convert function: PromoterAnalyticsConverter');
        return workbook;

    } catch (error) {
        this.logger.error('Error in PromoterAnalyticsConverter:', error);
        throw new ConverterException('Error converting promoter analytics data', error);
    }
}

}
