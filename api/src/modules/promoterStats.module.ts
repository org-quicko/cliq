import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PromoterStatsConverter } from "src/converters/promoterStats.converter";
import { PromoterStatsView } from "src/entities";
import { PromoterStatsService } from "src/services/promoterStats.service";

@Module({
    imports: [TypeOrmModule.forFeature([PromoterStatsView])],
    providers: [PromoterStatsService, PromoterStatsConverter],
    exports: [PromoterStatsService, PromoterStatsConverter]
})
export class PromoterStatsModule { }
