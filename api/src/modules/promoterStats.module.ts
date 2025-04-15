import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PromoterAnalyticsConverter } from "src/converters/promoterAnalytics.converter";
import { PromoterStatsView } from "src/entities";
import { PromoterStatsService } from "src/services/promoterStats.service";

@Module({
    imports: [TypeOrmModule.forFeature([PromoterStatsView])],
    providers: [PromoterStatsService, PromoterAnalyticsConverter],
    exports: [PromoterStatsService, PromoterAnalyticsConverter]
})
export class PromoterStatsModule { }
