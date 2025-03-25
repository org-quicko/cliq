import { Injectable } from "@nestjs/common";
import { PromoterWorkbook, ReferralRow, ReferralSheet, ReferralSummaryRow, ReferralSummarySheet, ReferralSummaryTable, ReferralTable } from "generated/sources/Promoter";
import { ReferralView, ReferralAggregateView } from "src/entities";
import { maskInfo } from "src/utils";
import { formatDate } from "src/utils/formatDate.util";

@Injectable()
export class ReferralConverter {

    private getReferralViewSheetRow(referral: ReferralView): ReferralRow {
        const newReferralRow = new ReferralRow([]);

        newReferralRow.setPromoterId(referral.promoterId);
        newReferralRow.setStatus(referral.status);
        newReferralRow.setContactId(referral.contactId);
        newReferralRow.setContactInfo(maskInfo(referral.contactInfo));
        newReferralRow.setTotalRevenue(Number(referral.totalRevenue));
        newReferralRow.setTotalCommission(Number(referral.totalCommission));
        newReferralRow.setUpdatedAt(formatDate(referral.updatedAt));

        return newReferralRow;
    }

    convertReferralViewToSheet(referrals: ReferralView[]): PromoterWorkbook {
        const newReferralTable = new ReferralTable();
        referrals.forEach((referral) => {
            const newReferralRow = this.getReferralViewSheetRow(referral);
            newReferralTable.addRow(newReferralRow);
        });

        const referralSheet = new ReferralSheet();
        referralSheet.addReferralTable(newReferralTable);

        const promoterWorkbook = new PromoterWorkbook();
        promoterWorkbook.addSheet(referralSheet);

        return promoterWorkbook;
    }

    convertReferralAggregateViewToSheet(referralAggs: ReferralAggregateView[]): PromoterWorkbook {
        const newReferralSummaryTable = new ReferralSummaryTable();

        referralAggs.forEach((referralAgg) => {
            const row = new ReferralSummaryRow([]);

            row.setProgramId(referralAgg.programId);
            row.setPromoterId(referralAgg.promoterId);
            row.setTotalSignups(Number(referralAgg.totalSignUps));
            row.setTotalPurchases(Number(referralAgg.totalPurchases));
            row.setTotalRevenue(Number(referralAgg.totalRevenue));
            row.setTotalCommission(Number(referralAgg.totalCommission));

            newReferralSummaryTable.addRow(row);
        });

        const referralAggregateSheet = new ReferralSummarySheet();
        referralAggregateSheet.addReferralSummaryTable(newReferralSummaryTable);

        const promoterWorkbook = new PromoterWorkbook();
        promoterWorkbook.addSheet(referralAggregateSheet);

        return promoterWorkbook;
    }


}