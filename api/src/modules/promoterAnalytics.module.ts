import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PromoterAnalyticsConverter } from "src/converters/promoterAnalytics.converter";
import { PromoterAnalyticsView } from "src/entities";
import { PromoterAnalyticsService } from "src/services/promoterAnalytics.service";

@Module({
    imports: [TypeOrmModule.forFeature([PromoterAnalyticsView])],
    providers: [PromoterAnalyticsService, PromoterAnalyticsConverter],
    exports: [PromoterAnalyticsService, PromoterAnalyticsConverter]
})
export class PromoterAnalyticsModule { }
