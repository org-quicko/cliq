import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTriggersForLinks1756834338064 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            -- Function to add a new link to analytics tables
            CREATE OR REPLACE FUNCTION add_link_to_analytics()
            RETURNS TRIGGER AS $$
            DECLARE
                current_date_val DATE := CURRENT_DATE;
            BEGIN
                -- Add to day-wise analytics table
                INSERT INTO link_analytics_day_wise_mv (
                    date, link_id, name, ref_val, program_id, promoter_id,
                    daily_signups, daily_purchases, daily_commission,
                    created_at, updated_at
                ) VALUES (
                    current_date_val, NEW.link_id, NEW.name, NEW.ref_val, 
                    NEW.program_id, NEW.promoter_id,
                    0, 0, 0,
                    NEW.created_at, NEW.updated_at
                )
                ON CONFLICT (date, link_id) DO NOTHING;

                -- Add to main analytics table
                INSERT INTO link_analytics_mv (
                    link_id, name, ref_val, program_id, promoter_id,
                    signups, purchases, commission,
                    created_at, updated_at
                ) VALUES (
                    NEW.link_id, NEW.name, NEW.ref_val, 
                    NEW.program_id, NEW.promoter_id,
                    0, 0, 0,
                    NEW.created_at, NEW.updated_at
                )
                ON CONFLICT (link_id) DO NOTHING;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            -- Function to update link analytics when link is updated
            CREATE OR REPLACE FUNCTION update_link_analytics()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Update day-wise analytics table
                UPDATE link_analytics_day_wise_mv 
                SET 
                    name = NEW.name,
                    ref_val = NEW.ref_val,
                    updated_at = NEW.updated_at
                WHERE link_id = NEW.link_id;

                -- Update main analytics table
                UPDATE link_analytics_mv 
                SET 
                    name = NEW.name,
                    ref_val = NEW.ref_val,
                    updated_at = NEW.updated_at
                WHERE link_id = NEW.link_id;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            -- Function to remove link from analytics when deleted or archived
            CREATE OR REPLACE FUNCTION remove_link_from_analytics()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Remove from day-wise analytics table
                DELETE FROM link_analytics_day_wise_mv 
                WHERE link_id = OLD.link_id;

                -- Remove from main analytics table
                DELETE FROM link_analytics_mv 
                WHERE link_id = OLD.link_id;

                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            -- Create trigger to add link to analytics when created
            CREATE TRIGGER trigger_add_link_to_analytics
                AFTER INSERT ON link
                FOR EACH ROW
                EXECUTE FUNCTION add_link_to_analytics();
        `);

        await queryRunner.query(`
            -- Create trigger to update analytics when link is updated
            CREATE TRIGGER trigger_update_link_analytics
                AFTER UPDATE ON link
                FOR EACH ROW
                EXECUTE FUNCTION update_link_analytics();
        `);

        await queryRunner.query(`
            -- Create trigger to remove analytics when link is deleted
            CREATE TRIGGER trigger_remove_link_from_analytics
                AFTER DELETE ON link
                FOR EACH ROW
                EXECUTE FUNCTION remove_link_from_analytics();
        `);

        await queryRunner.query(`
            -- Create trigger to remove analytics when link is archived
            CREATE TRIGGER trigger_remove_archived_link_from_analytics
                AFTER UPDATE ON link
                FOR EACH ROW
                WHEN (OLD.status != 'archived' AND NEW.status = 'archived')
                EXECUTE FUNCTION remove_link_from_analytics();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop triggers first
        await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_add_link_to_analytics ON link;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_update_link_analytics ON link;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_remove_link_from_analytics ON link;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_remove_archived_link_from_analytics ON link;`);

        // Drop functions
        await queryRunner.query(`DROP FUNCTION IF EXISTS add_link_to_analytics();`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_link_analytics();`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS remove_link_from_analytics();`);
    }

}
