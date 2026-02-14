import { Injectable, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { LoggerService } from './logger.service';

@Injectable()
export class MaterializedViewRefreshService implements OnModuleInit {
	private readonly cronExpression: string;

	private readonly materializedViews = [
		'program_summary_mv',
	];

	constructor(
		private readonly dataSource: DataSource,
		private readonly logger: LoggerService,
	) {
		this.cronExpression = process.env.REFRESH_MV_CRON || '*/5 * * * * '; 
	}

	onModuleInit() {
		this.logger.info(
			`MaterializedViewRefreshService initialized (Cron: ${this.cronExpression})`,
		);
	}


	@Cron(process.env.REFRESH_MV_CRON || '*/5 * * * * ', {
		name: 'refreshMaterializedViewsJob',
	})
	async refreshMaterializedViews() {
		this.logger.info('START: refreshMaterializedViews job');

		try {
			for (const view of this.materializedViews) {
				await this.refreshView(view);
			}

			this.logger.info('END: refreshMaterializedViews job completed');
		} catch (error) {
			this.logger.error('Error in refreshMaterializedViews job', error);
		}
	}


	async refreshView(viewName: string): Promise<boolean> {
		try {
			this.logger.info(`Refreshing materialized view: ${viewName}...`);
			await this.dataSource.query(`REFRESH MATERIALIZED VIEW ${viewName} WITH DATA`);
			this.logger.info(`Successfully refreshed: ${viewName}`);
			return true;
		} catch (error) {
			this.logger.error(`Failed to refresh ${viewName}:`, error);
			return false;
		}
	}

}
