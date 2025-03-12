import { Injectable } from "@nestjs/common";
import { PromoterWorkbook, ReferralAggregateRow, ReferralAggregateSheet, ReferralAggregateTable, ReferralRow, ReferralSheet, ReferralTable } from "generated/sources";
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

    private getReferralAggregateViewSheetRow(referralAgg: ReferralAggregateView): ReferralAggregateRow {

        const newReferralAggregateRow = new ReferralAggregateRow([]);

        newReferralAggregateRow.setProgramId(referralAgg.programId);
        newReferralAggregateRow.setPromoterId(referralAgg.promoterId);
        newReferralAggregateRow.setTotalSignups(Number(referralAgg.totalSignUps));
        newReferralAggregateRow.setTotalPurchases(Number(referralAgg.totalPurchases));
        newReferralAggregateRow.setTotalRevenue(Number(referralAgg.totalRevenue));
        newReferralAggregateRow.setTotalCommission(Number(referralAgg.totalCommission));

        return newReferralAggregateRow;
    }

    convertReferralAggregateViewToSheet(referralAggs: ReferralAggregateView[]): PromoterWorkbook {
        const newReferralAggregateTable = new ReferralAggregateTable();

        referralAggs.forEach((referralAgg) => {
            const newReferralAggregateRow = this.getReferralAggregateViewSheetRow(referralAgg);
            newReferralAggregateTable.addRow(newReferralAggregateRow);
        });

        const referralAggregateSheet = new ReferralAggregateSheet();
        referralAggregateSheet.addReferralAggregateTable(newReferralAggregateTable);

        const promoterWorkbook = new PromoterWorkbook();
        promoterWorkbook.addSheet(referralAggregateSheet);

        return promoterWorkbook;
    }


}