import { Injectable } from "@nestjs/common";
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

}