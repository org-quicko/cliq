import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../services/logger.service';
import { ConverterException } from '@org-quicko/core';

export interface IPromoterAnalyticsData {
    promoterId: string;
    promoterName: string;
    signups: number;
    purchases: number;
    revenue: number;
    commission: number;
}

export interface IPromoterAnalyticsConverterInput {
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
            
            // Create workbook structure
            const workbook = {
                name: 'PromoterAnalytics',
                sheets: [
                    {
                        name: 'PromoterAnalyticsSheet',
                        tables: [
                            {
                                name: 'PromoterAnalyticsTable',
                                columns: [
                                    { name: 'Promoter ID', key: 'promoterId' },
                                    { name: 'Promoter Name', key: 'promoterName' },
                                    { name: 'Signups', key: 'signups' },
                                    { name: 'Purchases', key: 'purchases' },
                                    { name: 'Revenue', key: 'revenue' },
                                    { name: 'Commission', key: 'commission' },
                                ],
                                rows: data.promoters.map(promoter => ({
                                    promoterId: promoter.promoterId,
                                    promoterName: promoter.promoterName,
                                    signups: promoter.signups,
                                    purchases: promoter.purchases,
                                    revenue: promoter.revenue,
                                    commission: promoter.commission,
                                })),
                            },
                        ],
                    },
                ],
                metadata: {
                    sortBy: data.sortBy,
                    period: data.period,
                    pagination: data.pagination,
                },
            };
            
            this.logger.info('END: convert function: PromoterAnalyticsConverter');
            return workbook;
        } catch (error) {
            this.logger.error('Error in PromoterAnalyticsConverter:', error);
            throw new ConverterException('Error converting promoter analytics data', error);
        }
    }
}
