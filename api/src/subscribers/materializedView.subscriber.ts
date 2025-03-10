import { Commission, Purchase, SignUp } from '../entities';
import { EventSubscriber, EntitySubscriberInterface, InsertEvent } from 'typeorm';

@EventSubscriber()
export class MaterializedViewSubscriber implements EntitySubscriberInterface {

    async afterInsert(event: InsertEvent<any>): Promise<void> {
        // Check if the inserted entity is one of the ones that should trigger a refresh
        if (event.entity instanceof Purchase || event.entity instanceof SignUp || event.entity instanceof Commission) {
            console.log('refreshing...');
            await this.refreshMaterializedViews(event);
        }
    }

    private async refreshMaterializedViews(event: InsertEvent<any>): Promise<void> {
        try {

            await event.queryRunner.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS referral_mv_idx 
                ON referral_mv (program_id, promoter_id, contact_id);
            `);
        
            await event.queryRunner.query(`REFRESH MATERIALIZED VIEW referral_mv;`);
        
            await event.queryRunner.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS referral_mv_aggregate_idx 
                ON referral_mv_aggregate (program_id, promoter_id);
            `);
        
            await event.queryRunner.query(`REFRESH MATERIALIZED VIEW referral_mv_aggregate;`);

            console.log('Materialized views refreshed successfully.');
        } catch (error) {
            console.error('Error refreshing materialized views:', error);
        }
    }

}
