import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PromoterAnalyticsConverter } from "src/converters/promoterAnalytics.converter";
import { PromoterAnalyticsView } from "src/entities";

@Module({
    imports: [TypeOrmModule.forFeature([PromoterAnalyticsView])],
    providers: [PromoterAnalyticsConverter],
    exports: [PromoterAnalyticsConverter]
})
export class PromoterAnalyticsModule { }
