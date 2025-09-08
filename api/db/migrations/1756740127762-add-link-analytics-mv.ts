import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLinkAnalyticMv1756740127762 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create link analytics tables
        await queryRunner.query(`
            -- Overall link analytics table
            CREATE TABLE link_analytics_mv (
                link_id UUID NOT NULL,
                name VARCHAR NOT NULL,
                ref_val VARCHAR NOT NULL,
                program_id UUID NOT NULL,
                promoter_id UUID NOT NULL,
                signups NUMERIC DEFAULT 0,
                purchases NUMERIC DEFAULT 0,
                commission NUMERIC DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                PRIMARY KEY (link_id)
            );
        `);

        await queryRunner.query(`
            -- Day-wise link analytics table
            CREATE TABLE link_analytics_day_wise_mv (
                date DATE NOT NULL,
                link_id UUID NOT NULL,
                name VARCHAR NOT NULL,
                ref_val VARCHAR NOT NULL,
                program_id UUID NOT NULL,
                promoter_id UUID NOT NULL,
                signups NUMERIC DEFAULT 0,
                purchases NUMERIC DEFAULT 0,
                commission NUMERIC DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                PRIMARY KEY (date, link_id)
            );
        `);

        // Create indexes for performance
        await queryRunner.query(`
            -- Link analytics MV indexes
            CREATE INDEX IF NOT EXISTS idx_link_analytics_program_id ON link_analytics_mv (program_id);
            CREATE INDEX IF NOT EXISTS idx_link_analytics_promoter_id ON link_analytics_mv (promoter_id);
            CREATE INDEX IF NOT EXISTS idx_link_analytics_ref_val ON link_analytics_mv (ref_val);
            
            CREATE INDEX IF NOT EXISTS idx_link_analytics_program_promoter ON link_analytics_mv (program_id, promoter_id);
            CREATE INDEX IF NOT EXISTS idx_link_analytics_promoter_ref_val ON link_analytics_mv (promoter_id, ref_val);
            CREATE INDEX IF NOT EXISTS idx_link_analytics_created_at ON link_analytics_mv (created_at);
        `);

        await queryRunner.query(`
            -- Link analytics day-wise MV indexes
            CREATE INDEX IF NOT EXISTS idx_link_analytics_day_wise_date ON link_analytics_day_wise_mv (date);
            CREATE INDEX IF NOT EXISTS idx_link_analytics_day_wise_link ON link_analytics_day_wise_mv (link_id);
            CREATE INDEX IF NOT EXISTS idx_link_analytics_day_wise_program ON link_analytics_day_wise_mv (program_id);
            CREATE INDEX IF NOT EXISTS idx_link_analytics_day_wise_promoter ON link_analytics_day_wise_mv (promoter_id);
            CREATE INDEX IF NOT EXISTS idx_link_analytics_day_wise_date_program ON link_analytics_day_wise_mv (date, program_id);
            CREATE INDEX IF NOT EXISTS idx_link_analytics_day_wise_date_link ON link_analytics_day_wise_mv (date, link_id);
            CREATE INDEX IF NOT EXISTS idx_link_analytics_day_wise_date_promoter ON link_analytics_day_wise_mv (date, promoter_id);
            CREATE INDEX IF NOT EXISTS idx_link_analytics_day_wise_program_promoter ON link_analytics_day_wise_mv (program_id, promoter_id);
            CREATE INDEX IF NOT EXISTS idx_link_analytics_day_wise_date_program_promoter ON link_analytics_day_wise_mv (date, program_id, promoter_id);
        `);

        // Create functions
        await queryRunner.query(`
            -- Function to aggregate link analytics from day-wise data
            CREATE OR REPLACE FUNCTION aggregate_link_analytics_from_day_wise()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Handle DELETE operations by removing the record from link_analytics_mv
                IF TG_OP = 'DELETE' THEN
                    DELETE FROM link_analytics_mv 
                    WHERE link_id = OLD.link_id;
                    RETURN NULL;
                END IF;

                -- Handle INSERT and UPDATE operations
                INSERT INTO link_analytics_mv (link_id, name, ref_val, program_id, promoter_id, signups, purchases, commission, created_at, updated_at)
                VALUES (
                    NEW.link_id,
                    NEW.name,
                    NEW.ref_val,
                    NEW.program_id,
                    NEW.promoter_id,
                    (SELECT COALESCE(SUM(signups), 0) FROM link_analytics_day_wise_mv WHERE link_id = NEW.link_id),
                    (SELECT COALESCE(SUM(purchases), 0) FROM link_analytics_day_wise_mv WHERE link_id = NEW.link_id),
                    (SELECT COALESCE(SUM(commission), 0) FROM link_analytics_day_wise_mv WHERE link_id = NEW.link_id),
                    NEW.created_at,
                    NEW.updated_at
                )
                ON CONFLICT (link_id)
                DO UPDATE SET
                    signups = EXCLUDED.signups,
                    purchases = EXCLUDED.purchases,
                    commission = EXCLUDED.commission,
                    updated_at = EXCLUDED.updated_at;

                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            -- Function to update link analytics day-wise when signup is created/updated/deleted
            CREATE OR REPLACE FUNCTION update_link_analytics_from_signup()
            RETURNS TRIGGER AS $$
            DECLARE
                v_link_id UUID;
                v_name VARCHAR;
                v_ref_val VARCHAR;
                v_program_id UUID;
                v_promoter_id UUID;
                v_created_at TIMESTAMPTZ;
                v_updated_at TIMESTAMPTZ;
                signups_count NUMERIC;
                purchases_count NUMERIC;
                commission_amount NUMERIC;
                record_date DATE;
                date_start TIMESTAMPTZ;
                date_end TIMESTAMPTZ;
            BEGIN
                v_link_id := COALESCE(NEW.link_id, OLD.link_id);
                record_date := DATE(COALESCE(NEW.created_at, OLD.created_at));
                date_start := record_date::timestamp;
                date_end := record_date::timestamp + INTERVAL '1 day';

                -- Early exit if no link_id
                IF v_link_id IS NULL THEN
                    RETURN COALESCE(NEW, OLD);
                END IF;

                -- Get all required data in a single optimized query
                WITH link_data AS (
                    SELECT 
                        l.link_id,
                        l.name,
                        l.ref_val,
                        l.program_id,
                        l.promoter_id,
                        l.created_at,
                        l.updated_at
                    FROM link l
                    WHERE l.link_id = v_link_id
                ),
                daily_metrics AS (
                    SELECT 
                        COUNT(DISTINCT s.contact_id) as signups,
                        COUNT(DISTINCT p.purchase_id) as purchases,
                        COALESCE(SUM(c.amount), 0) as commission
                    FROM sign_up s
                    LEFT JOIN purchase p ON p.link_id = s.link_id 
                        AND p.created_at >= date_start 
                        AND p.created_at < date_end
                    LEFT JOIN commission c ON c.link_id = s.link_id 
                        AND c.created_at >= date_start 
                        AND c.created_at < date_end
                    WHERE s.link_id = v_link_id 
                      AND s.created_at >= date_start
                      AND s.created_at < date_end
                )
                SELECT 
                    ld.link_id,
                    ld.name,
                    ld.ref_val,
                    ld.program_id,
                    ld.promoter_id,
                    ld.created_at,
                    ld.updated_at,
                    dm.signups,
                    dm.purchases,
                    dm.commission
                INTO v_link_id, v_name, v_ref_val, v_program_id, v_promoter_id, v_created_at, v_updated_at, signups_count, purchases_count, commission_amount
                FROM link_data ld
                CROSS JOIN daily_metrics dm;

                -- Early exit if no link found
                IF v_link_id IS NULL THEN
                    RETURN COALESCE(NEW, OLD);
                END IF;

                IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
                    INSERT INTO link_analytics_day_wise_mv (
                        date, link_id, name, ref_val, program_id, promoter_id, 
                        signups, purchases, commission,
                        created_at, updated_at
                    ) VALUES (
                        record_date,
                        v_link_id,
                        v_name,
                        v_ref_val,
                        v_program_id,
                        v_promoter_id,
                        signups_count,
                        purchases_count,
                        commission_amount,
                        v_created_at,
                        v_updated_at
                    )
                    ON CONFLICT (date, link_id) 
                    DO UPDATE SET 
                        signups = EXCLUDED.signups,
                        purchases = EXCLUDED.purchases,
                        commission = EXCLUDED.commission,
                        updated_at = now();
                ELSIF TG_OP = 'DELETE' THEN
                    UPDATE link_analytics_day_wise_mv 
                    SET 
                        signups = signups_count,
                        purchases = purchases_count,
                        commission = commission_amount,
                        updated_at = now()
                    WHERE link_id = v_link_id 
                      AND date = record_date;
                END IF;
                
                RETURN COALESCE(NEW, OLD);
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            -- Function to update link analytics day-wise when purchase is created/updated/deleted
            CREATE OR REPLACE FUNCTION update_link_analytics_from_purchase()
            RETURNS TRIGGER AS $$
            DECLARE
                link_data RECORD;
                purchases_count NUMERIC;
                record_date DATE;
            BEGIN
                -- Get link data once
                SELECT l.link_id, l.name, l.ref_val, l.program_id, l.promoter_id, l.created_at, l.updated_at
                INTO link_data
                FROM link l
                WHERE l.link_id = COALESCE(NEW.link_id, OLD.link_id);

                IF link_data.link_id IS NULL THEN
                    RETURN COALESCE(NEW, OLD);
                END IF;

                record_date := DATE(COALESCE(NEW.created_at, OLD.created_at));

                -- Calculate daily purchases count once
                SELECT COUNT(p.purchase_id)
                INTO purchases_count
                FROM purchase p
                WHERE p.link_id = link_data.link_id 
                  AND p.created_at >= record_date::timestamp
                  AND p.created_at < record_date::timestamp + INTERVAL '1 day';

                IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
                    INSERT INTO link_analytics_day_wise_mv (
                        date, link_id, name, ref_val, program_id, promoter_id, 
                        signups, purchases, commission,
                        created_at, updated_at
                    ) VALUES (
                        record_date,
                        link_data.link_id,
                        link_data.name,
                        link_data.ref_val,
                        link_data.program_id,
                        link_data.promoter_id,
                        0,
                        purchases_count,
                        0,
                        link_data.created_at,
                        link_data.updated_at
                    )
                    ON CONFLICT (date, link_id) 
                    DO UPDATE SET 
                        purchases = EXCLUDED.purchases,
                        updated_at = now();
                ELSIF TG_OP = 'DELETE' THEN
                    UPDATE link_analytics_day_wise_mv 
                    SET 
                        purchases = purchases_count,
                        updated_at = now()
                    WHERE link_id = link_data.link_id 
                      AND date = record_date;
                END IF;
                
                RETURN COALESCE(NEW, OLD);
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            -- Function to update link analytics day-wise when commission is created/updated/deleted
            CREATE OR REPLACE FUNCTION update_link_analytics_from_commission()
            RETURNS TRIGGER AS $$
            DECLARE
                link_data RECORD;
                commission_amount NUMERIC;
                record_date DATE;
            BEGIN
                -- Get link data once
                SELECT l.link_id, l.name, l.ref_val, l.program_id, l.promoter_id, l.created_at, l.updated_at
                INTO link_data
                FROM link l
                WHERE l.link_id = COALESCE(NEW.link_id, OLD.link_id);

                IF link_data.link_id IS NULL THEN
                    RETURN COALESCE(NEW, OLD);
                END IF;

                record_date := DATE(COALESCE(NEW.created_at, OLD.created_at));

                -- Calculate daily commission amount once
                SELECT COALESCE(SUM(amount), 0)
                INTO commission_amount
                FROM commission c
                WHERE c.link_id = link_data.link_id 
                  AND c.created_at >= record_date::timestamp
                  AND c.created_at < record_date::timestamp + INTERVAL '1 day';

                IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
                    INSERT INTO link_analytics_day_wise_mv (
                        date, link_id, name, ref_val, program_id, promoter_id, 
                        signups, purchases, commission,
                        created_at, updated_at
                    ) VALUES (
                        record_date,
                        link_data.link_id,
                        link_data.name,
                        link_data.ref_val,
                        link_data.program_id,
                        link_data.promoter_id,
                        0,
                        0,
                        commission_amount,
                        link_data.created_at,
                        link_data.updated_at
                    )
                    ON CONFLICT (date, link_id) 
                    DO UPDATE SET 
                        commission = EXCLUDED.commission,
                        updated_at = now();
                ELSIF TG_OP = 'DELETE' THEN
                    UPDATE link_analytics_day_wise_mv 
                    SET 
                        commission = commission_amount,
                        updated_at = now()
                    WHERE link_id = link_data.link_id 
                      AND date = record_date;
                END IF;
                
                RETURN COALESCE(NEW, OLD);
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        // Create triggers
        await queryRunner.query(`
            -- Create trigger to automatically update aggregated data
            CREATE TRIGGER trigger_aggregate_link_analytics
                AFTER INSERT OR UPDATE OR DELETE ON link_analytics_day_wise_mv
                FOR EACH ROW
                EXECUTE FUNCTION aggregate_link_analytics_from_day_wise();
        `);

        await queryRunner.query(`
            -- Create triggers for signup table
            CREATE TRIGGER trigger_update_link_analytics_from_signup
                AFTER INSERT OR UPDATE OR DELETE ON sign_up
                FOR EACH ROW
                EXECUTE FUNCTION update_link_analytics_from_signup();
        `);

        await queryRunner.query(`
            -- Create triggers for purchase table
            CREATE TRIGGER trigger_update_link_analytics_from_purchase
                AFTER INSERT OR UPDATE OR DELETE ON purchase
                FOR EACH ROW
                EXECUTE FUNCTION update_link_analytics_from_purchase();
        `);

        await queryRunner.query(`
            -- Create triggers for commission table
            CREATE TRIGGER trigger_update_link_analytics_from_commission
                AFTER INSERT OR UPDATE OR DELETE ON commission
                FOR EACH ROW
                EXECUTE FUNCTION update_link_analytics_from_commission();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop triggers first
        await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_update_link_analytics_from_commission ON commission;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_update_link_analytics_from_purchase ON purchase;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_update_link_analytics_from_signup ON sign_up;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_aggregate_link_analytics ON link_analytics_day_wise_mv;`);

        // Drop functions
        // await queryRunner.query(`DROP FUNCTION IF EXISTS initialize_link_analytics();`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_link_analytics_from_commission();`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_link_analytics_from_purchase();`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_link_analytics_from_signup();`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS aggregate_link_analytics_from_day_wise();`);

        // Drop indexes for link_analytics_day_wise_mv
        await queryRunner.query(`DROP INDEX IF EXISTS idx_link_analytics_day_wise_date;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_link_analytics_day_wise_link;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_link_analytics_day_wise_program;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_link_analytics_day_wise_promoter;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_link_analytics_day_wise_date_program;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_link_analytics_day_wise_date_link;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_link_analytics_day_wise_date_promoter;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_link_analytics_day_wise_program_promoter;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_link_analytics_day_wise_date_program_promoter;`);

        // Drop indexes for link_analytics_mv
        await queryRunner.query(`DROP INDEX IF EXISTS idx_link_analytics_program_id;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_link_analytics_promoter_id;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_link_analytics_ref_val;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_link_analytics_program_promoter;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_link_analytics_promoter_ref_val;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_link_analytics_created_at;`);

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS link_analytics_day_wise_mv;`);
        await queryRunner.query(`DROP TABLE IF EXISTS link_analytics_mv;`);
    }

}
