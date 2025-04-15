import { Injectable } from "@nestjs/common";
import { PromoterAnalyticsRow, PromoterAnalyticsSheet, PromoterAnalyticsTable, PromoterWorkbook } from "generated/sources/Promoter";
import { PromoterStatsView } from "src/entities/promoterStats.view";

@Injectable()
export class PromoterAnalyticsConverter {

    convertPromoterStatsViewToSheet(promoterStats: PromoterStatsView[]): PromoterWorkbook {
        const promoterStatsTable = new PromoterAnalyticsTable();
    
        promoterStats.forEach((referralAgg) => {
            const row = new PromoterAnalyticsRow([]);
    
            row.setProgramId(referralAgg.programId);
            row.setPromoterId(referralAgg.promoterId);
            row.setTotalSignups(Number(referralAgg.totalSignUps));
            row.setTotalPurchases(Number(referralAgg.totalPurchases));
            row.setTotalRevenue(Number(referralAgg.totalRevenue));
            row.setTotalCommission(Number(referralAgg.totalCommission));
    
            promoterStatsTable.addRow(row);
        });
    
        const promoterStatsSheet = new PromoterAnalyticsSheet();
        promoterStatsSheet.addPromoterAnalyticsTable(promoterStatsTable);
    
        const promoterWorkbook = new PromoterWorkbook();
        promoterWorkbook.addSheet(promoterStatsSheet);
    
        return promoterWorkbook;
    }

}
