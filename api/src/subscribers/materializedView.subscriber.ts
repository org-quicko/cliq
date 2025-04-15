import { linkAnalyticsMVName, linkTableName, promoterAnalyticsMVName, referralMVName } from 'src/constants';
import { Commission, Link, ProgramPromoter, Promoter, PromoterMember, Purchase, SignUp } from '../entities';
import {
    EventSubscriber,
    EntitySubscriberInterface,
    InsertEvent,
    RemoveEvent,
    UpdateEvent,
} from 'typeorm';

@EventSubscriber()
export class MaterializedViewSubscriber implements EntitySubscriberInterface {
    async afterInsert(event: InsertEvent<any>): Promise<void> {

        // Check if the inserted entity is one of the ones that should trigger a refresh
        if (
            event.entity instanceof Purchase ||
            event.entity instanceof SignUp ||
            event.entity instanceof Commission || 
            event.entity instanceof ProgramPromoter
        ) {
            console.log('refreshing...');
            await this.refreshMaterializedViews(event);
        }

        if (event.entity instanceof Link) {
            await event.queryRunner.query(
                `REFRESH MATERIALIZED VIEW ${linkAnalyticsMVName};`,
            );

            console.log(`Materialized view- ${linkAnalyticsMVName} refreshed successfully.`);
        }
    }

    async afterRemove(event: RemoveEvent<any>): Promise<void> {
        if (event.entity instanceof Link) {
            await event.queryRunner.query(
                `REFRESH MATERIALIZED VIEW ${linkAnalyticsMVName};`,
            );

            console.log(`Materialized view- ${linkAnalyticsMVName} refreshed successfully.`);
        }
        if (event.entity instanceof Promoter) {
            await event.queryRunner.query(
                `REFRESH MATERIALIZED VIEW ${promoterAnalyticsMVName};`
            );

            console.log(`Materialized view- ${promoterAnalyticsMVName} refreshed successfully.`);
        }
    }

    async afterUpdate(event: UpdateEvent<any>): Promise<void> {
        console.log('Updated fields:', event.updatedColumns.map(col => col.propertyName), event.entity, event.databaseEntity);
        
        if (event.metadata.tableName === linkTableName) {
            await event.queryRunner.query(
                `REFRESH MATERIALIZED VIEW ${linkAnalyticsMVName};`,
            );
        } 
        if (event.entity instanceof ProgramPromoter) {
            await event.queryRunner.query(
                `REFRESH MATERIALIZED VIEW ${promoterAnalyticsMVName};`
            );

            console.log(`Materialized view- ${promoterAnalyticsMVName} refreshed successfully.`);
        }
    }

    private async refreshMaterializedViews(
        event: InsertEvent<any>,
    ): Promise<void> {

        try {
            await event.queryRunner.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS ${referralMVName}_idx 
                ON ${referralMVName} (program_id, promoter_id, contact_id);
            `);

            await event.queryRunner.query(
                `REFRESH MATERIALIZED VIEW ${referralMVName};`,
            );

            await event.queryRunner.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS ${promoterAnalyticsMVName}_idx 
                ON ${promoterAnalyticsMVName} (program_id, promoter_id);
            `);

            await event.queryRunner.query(
                `REFRESH MATERIALIZED VIEW ${promoterAnalyticsMVName};`,
            );

            await event.queryRunner.query(
                `REFRESH MATERIALIZED VIEW ${linkAnalyticsMVName};`,
            );

            console.log('Materialized views refreshed successfully.');
        } catch (error) {
            console.error('Error refreshing materialized views:', error);
        }
    }
}
