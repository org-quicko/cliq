import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReferralConverter } from "src/converters/referral.converter";
import { ReferralUserConverter } from "src/converters/referralUser.converter";
import { ReferralPaginatedConverter } from "src/converters/referralpaginated.converter";
import { ReferralView } from "src/entities";
import { ReferralService } from "src/services/referral.service";

@Module({
	imports: [TypeOrmModule.forFeature([ReferralView])],
	providers: [ReferralService, ReferralConverter, ReferralUserConverter, ReferralPaginatedConverter],
	exports: [ReferralService, ReferralConverter, ReferralUserConverter, ReferralPaginatedConverter]
})
export class ReferralModule { }
