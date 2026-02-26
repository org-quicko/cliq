import { Injectable } from "@nestjs/common";
import { ReferralDto, PromoterDto } from "../dtos";
import { Promoter, ReferralView } from "../entities";
import { ConverterException } from '@org-quicko/core';

@Injectable()
export class ReferralUserConverter {
    convertTo(referral: ReferralView, promoterNameMap?: Map<string, string>): ReferralDto {
        try {
            const referralDto = new ReferralDto();
            referralDto.contactId = referral.contactId;
            referralDto.programId = referral.programId;
            referralDto.promoterId = referral.promoterId;
            referralDto.promoterName = promoterNameMap?.get(referral.contactId)!;
            referralDto.contactInfo = referral.contactInfo;
            referralDto.status = referral.status;
            referralDto.totalCommission = referral.totalCommission;
            referralDto.totalRevenue = referral.totalRevenue;
            referralDto.updatedAt = referral.updatedAt;
            return referralDto;
        } catch (error) {
            throw new ConverterException('Error converting ReferralView entity to ReferralDto', error);
        }
    }
}