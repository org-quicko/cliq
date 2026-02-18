import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MaterializedViewRefreshService } from '../services/materializedViewRefresh.service';
import { LoggerModule } from './logger.module';

@Module({
	imports: [
		ScheduleModule.forRoot(),
		LoggerModule,
	],
	providers: [MaterializedViewRefreshService],
	exports: [MaterializedViewRefreshService],
})
export class MaterializedViewRefreshModule {}
