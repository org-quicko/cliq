import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MaterializedViewRefreshService } from '../services/materializedViewRefresh.service';

@Module({
	imports: [
		ScheduleModule.forRoot(),
	],
	providers: [MaterializedViewRefreshService],
	exports: [MaterializedViewRefreshService],
})
export class MaterializedViewRefreshModule {}
