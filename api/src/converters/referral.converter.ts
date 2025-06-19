import { Injectable } from "@nestjs/common";
import { ReferralDto } from "../dtos";
import { ReferralView } from "../entities";
import { maskInfo } from "../utils";
import { ConverterException } from '@org-quicko/core';

@Injectable()
export class ReferralConverter {
	convertTo(referral: ReferralView): ReferralDto {
		try {
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
		} catch (error) {
			throw new ConverterException('Error converting ReferralView entity to ReferralDto', error);
		}
	}
}