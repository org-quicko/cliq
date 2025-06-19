import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PromoterAnalyticsView } from "src/entities";

@Module({
	imports: [TypeOrmModule.forFeature([PromoterAnalyticsView])],
})
export class PromoterAnalyticsModule { }
