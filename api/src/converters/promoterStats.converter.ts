import { Injectable } from "@nestjs/common";
import { PromoterStatsRow, PromoterStatsSheet, PromoterStatsTable, PromoterWorkbook } from "generated/sources/Promoter";
import { PromoterStatsView } from "src/entities/promoterStats.view";

@Injectable()
export class PromoterStatsConverter {

    convertPromoterStatsViewToSheet(promoterStats: PromoterStatsView[]): PromoterWorkbook {
        const promoterStatsTable = new PromoterStatsTable();
    
        promoterStats.forEach((referralAgg) => {
            const row = new PromoterStatsRow([]);
    
            row.setProgramId(referralAgg.programId);
            row.setPromoterId(referralAgg.promoterId);
            row.setTotalSignups(Number(referralAgg.totalSignUps));
            row.setTotalPurchases(Number(referralAgg.totalPurchases));
            row.setTotalRevenue(Number(referralAgg.totalRevenue));
            row.setTotalCommission(Number(referralAgg.totalCommission));
    
            promoterStatsTable.addRow(row);
        });
    
        const promoterStatsSheet = new PromoterStatsSheet();
        promoterStatsSheet.addPromoterStatsTable(promoterStatsTable);
    
        const promoterWorkbook = new PromoterWorkbook();
        promoterWorkbook.addSheet(promoterStatsSheet);
    
        return promoterWorkbook;
    }

}
