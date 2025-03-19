import { linkStatsMVName, referralAggregateMVName, referralMVName } from 'src/constants';
import { Commission, Link, Purchase, SignUp } from '../entities';
import {
	EventSubscriber,
	EntitySubscriberInterface,
	InsertEvent,
	RemoveEvent,
} from 'typeorm';

@EventSubscriber()
export class MaterializedViewSubscriber implements EntitySubscriberInterface {

	async afterInsert(event: InsertEvent<any>): Promise<void> {
		// Check if the inserted entity is one of the ones that should trigger a refresh
		if (
			event.entity instanceof Purchase ||
			event.entity instanceof SignUp ||
			event.entity instanceof Commission
		) {
			console.log('refreshing...');
			await this.refreshMaterializedViews(event);
		}

		if (event.entity instanceof Link) {
			await event.queryRunner.query(
				`REFRESH MATERIALIZED VIEW ${linkStatsMVName};`,
			);
		}
	}

	async afterRemove(event: RemoveEvent<any>): Promise<void> {
		if (event.entity instanceof Link) {
			try {
				await event.queryRunner.startTransaction();
				await event.queryRunner.query(
					`REFRESH MATERIALIZED VIEW ${linkStatsMVName};`,
				);
				await event.queryRunner.commitTransaction();
			} catch (error) {
				await event.queryRunner.rollbackTransaction();
			} 
		}
	}

	private async refreshMaterializedViews(
		event: InsertEvent<any>,
	): Promise<void> {

		try {
			await event.queryRunner.startTransaction();

			await event.queryRunner.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS ${referralMVName}_idx 
                ON ${referralMVName} (program_id, promoter_id, contact_id);
            `);

			await event.queryRunner.query(
				`REFRESH MATERIALIZED VIEW ${referralMVName};`,
			);

			await event.queryRunner.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS ${referralMVName}_aggregate_idx 
                ON ${referralAggregateMVName} (program_id, promoter_id);
			`);

			await event.queryRunner.query(
				`REFRESH MATERIALIZED VIEW ${referralAggregateMVName};`,
			);

			await event.queryRunner.query(
				`REFRESH MATERIALIZED VIEW ${linkStatsMVName};`,
			);

			console.log('Materialized views refreshed successfully.');
			await event.queryRunner.commitTransaction();
		} catch (error) {
			await event.queryRunner.rollbackTransaction();
		} 
	}
}
