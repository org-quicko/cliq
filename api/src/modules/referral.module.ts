import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReferralConverter } from "src/converters/referral.converter";
import { ReferralAggregateView, ReferralView } from "src/entities";
import { ReferralService } from "src/services/referral.service";

@Module({
    imports: [TypeOrmModule.forFeature([ReferralView, ReferralAggregateView])],
    providers: [ReferralService, ReferralConverter],
    exports: [ReferralService, ReferralConverter,]
})
export class ReferralModule { }
