import { Injectable } from "@nestjs/common";
import { JSONObject } from "@org-quicko/core";
import { PromoterWorkbook, ReferralRow, ReferralSheet, ReferralTable } from "generated/sources/Promoter";
import { ReferralDto } from "src/dtos";
import { ReferralView } from "src/entities";
import { maskInfo } from "src/utils";

@Injectable()
export class ReferralConverter {

    convertTo(referral: ReferralView): ReferralDto{
        const referralDto = new ReferralDto();

        referralDto.contactId = referral.contactId;
        referralDto.programId = referral.programId;
        referralDto.promoterId = referral.promoterId;
        referralDto.contactInfo = maskInfo(referral.contactInfo);
        referralDto.status = referral.status;
        referralDto.totalCommission = referral.totalCommission;
        referralDto.totalRevenue = referral.totalRevenue;
        referralDto.updatedAt = referral.updatedAt;

        return referralDto;
    }

    convertReferralViewToSheet(referrals: ReferralView[], count: number): PromoterWorkbook {
        const referralTable = new ReferralTable();
        referralTable.setMetadata(new JSONObject({ count }));

        referrals.forEach((referral) => {
            const row = new ReferralRow([]);

            row.setPromoterId(referral.promoterId);
            row.setStatus(referral.status);
            row.setContactId(referral.contactId);
            row.setContactInfo(maskInfo(referral.contactInfo));
            row.setTotalRevenue(Number(referral.totalRevenue));
            row.setTotalCommission(Number(referral.totalCommission));
            row.setUpdatedAt(referral.updatedAt.toISOString());

            referralTable.addRow(row);
        });

        const referralSheet = new ReferralSheet();
        referralSheet.addReferralTable(referralTable);

        const promoterWorkbook = new PromoterWorkbook();
        promoterWorkbook.addSheet(referralSheet);

        return promoterWorkbook;
    }


}