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
		this.cronExpression = process.env.REFRESH_MV_CRON || '*/5 * * * * *'; 
	}

	onModuleInit() {
		this.logger.info(
			`MaterializedViewRefreshService initialized (Cron: ${this.cronExpression})`,
		);
	}


	@Cron(process.env.REFRESH_MV_CRON || '*/5 * * * * *', {
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
			

			try {
				await this.dataSource.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName}`);
				this.logger.info(`Successfully refreshed (CONCURRENTLY): ${viewName}`);
				return true;
			} catch (concurrentError) {

				this.logger.warn(`CONCURRENT refresh failed for ${viewName}, trying regular refresh...`);
				await this.dataSource.query(`REFRESH MATERIALIZED VIEW ${viewName}`);
				this.logger.info(`Successfully refreshed: ${viewName}`);
				return true;
			}
		} catch (error) {
			this.logger.error(`Failed to refresh ${viewName}:`, error);
			return false;
		}
	}

	async refreshAllViews(): Promise<{ success: string[]; failed: string[] }> {
		this.logger.info('START: Manual refreshAllViews');
		
		const success: string[] = [];
		const failed: string[] = [];

		for (const view of this.materializedViews) {
			const result = await this.refreshView(view);
			if (result) {
				success.push(view);
			} else {
				failed.push(view);
			}
		}

		this.logger.info(`END: Manual refreshAllViews - Success: ${success.length}, Failed: ${failed.length}`);
		return { success, failed };
	}

	async refreshSpecificViews(viewNames: string[]): Promise<{ success: string[]; failed: string[] }> {
		this.logger.info(`START: refreshSpecificViews - ${viewNames.join(', ')}`);
		
		const success: string[] = [];
		const failed: string[] = [];

		for (const view of viewNames) {
			if (this.materializedViews.includes(view)) {
				const result = await this.refreshView(view);
				if (result) {
					success.push(view);
				} else {
					failed.push(view);
				}
			} else {
				this.logger.warn(`Unknown materialized view: ${view}`);
				failed.push(view);
			}
		}

		this.logger.info(`END: refreshSpecificViews - Success: ${success.length}, Failed: ${failed.length}`);
		return { success, failed };
	}
}
