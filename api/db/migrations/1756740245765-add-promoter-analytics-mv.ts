import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPromoterAnalyticsMv1756740245765 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		// Create promoter analytics tables
		await queryRunner.query(`
            -- Overall promoter analytics table
            CREATE TABLE promoter_analytics_mv (
                promoter_id UUID NOT NULL,
                program_id UUID NOT NULL,
                total_revenue NUMERIC DEFAULT 0,
                total_commission NUMERIC DEFAULT 0,
                total_signups NUMERIC DEFAULT 0,
                total_purchases NUMERIC DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                PRIMARY KEY (promoter_id, program_id)
            );
        `);

		await queryRunner.query(`
            -- Day-wise promoter analytics table
            CREATE TABLE promoter_analytics_day_wise_mv (
                date DATE NOT NULL,
                promoter_id UUID NOT NULL,
                program_id UUID NOT NULL,
                revenue NUMERIC DEFAULT 0,
                commission NUMERIC DEFAULT 0,
                signups NUMERIC DEFAULT 0,
                purchases NUMERIC DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                PRIMARY KEY (date, promoter_id, program_id)
            );
        `);

		// Create indexes for performance
		await queryRunner.query(`
            -- Promoter analytics MV indexes
            CREATE INDEX IF NOT EXISTS idx_promoter_analytics_promoter_id ON promoter_analytics_mv (promoter_id);
            CREATE INDEX IF NOT EXISTS idx_promoter_analytics_program_id ON promoter_analytics_mv (program_id);
            CREATE INDEX IF NOT EXISTS idx_promoter_analytics_created_at ON promoter_analytics_mv (created_at);
        `);

		await queryRunner.query(`
            -- Promoter analytics day-wise MV indexes
            CREATE INDEX IF NOT EXISTS idx_promoter_analytics_day_wise_date ON promoter_analytics_day_wise_mv (date);
            CREATE INDEX IF NOT EXISTS idx_promoter_analytics_day_wise_promoter ON promoter_analytics_day_wise_mv (promoter_id);
            CREATE INDEX IF NOT EXISTS idx_promoter_analytics_day_wise_program ON promoter_analytics_day_wise_mv (program_id);
            CREATE INDEX IF NOT EXISTS idx_promoter_analytics_day_wise_date_promoter ON promoter_analytics_day_wise_mv (date, promoter_id);
            CREATE INDEX IF NOT EXISTS idx_promoter_analytics_day_wise_date_program ON promoter_analytics_day_wise_mv (date, program_id);
            CREATE INDEX IF NOT EXISTS idx_promoter_analytics_day_wise_date_promoter_program ON promoter_analytics_day_wise_mv (date, promoter_id, program_id);
        `);


		// Create functions
		await queryRunner.query(`
            -- Function to aggregate promoter analytics from day-wise data
            CREATE OR REPLACE FUNCTION aggregate_promoter_analytics_from_day_wise()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Handle DELETE operations by removing the record from promoter_analytics_mv
                IF TG_OP = 'DELETE' THEN
                    DELETE FROM promoter_analytics_mv 
                    WHERE promoter_id = OLD.promoter_id 
                      AND program_id = OLD.program_id;
                    RETURN NULL;
                END IF;

                -- Handle INSERT and UPDATE operations
                INSERT INTO promoter_analytics_mv (promoter_id, program_id, total_revenue, total_commission, total_signups, total_purchases, created_at, updated_at)
                VALUES (
                    NEW.promoter_id,
                    NEW.program_id,
                    (SELECT COALESCE(SUM(revenue), 0) FROM promoter_analytics_day_wise_mv WHERE promoter_id = NEW.promoter_id AND program_id = NEW.program_id),
                    (SELECT COALESCE(SUM(commission), 0) FROM promoter_analytics_day_wise_mv WHERE promoter_id = NEW.promoter_id AND program_id = NEW.program_id),
                    (SELECT COALESCE(SUM(signups), 0) FROM promoter_analytics_day_wise_mv WHERE promoter_id = NEW.promoter_id AND program_id = NEW.program_id),
                    (SELECT COALESCE(SUM(purchases), 0) FROM promoter_analytics_day_wise_mv WHERE promoter_id = NEW.promoter_id AND program_id = NEW.program_id),
                    NEW.created_at,
                    NEW.updated_at
                )
                ON CONFLICT (promoter_id, program_id)
                DO UPDATE SET
                    total_revenue = EXCLUDED.total_revenue,
                    total_commission = EXCLUDED.total_commission,
                    total_signups = EXCLUDED.total_signups,
                    total_purchases = EXCLUDED.total_purchases,
                    updated_at = EXCLUDED.updated_at;

                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        `);

		await queryRunner.query(`
            -- Function to update promoter analytics day-wise when signup is created/updated/deleted
            CREATE OR REPLACE FUNCTION update_promoter_analytics_from_signup()
            RETURNS TRIGGER AS $$
            DECLARE
                v_program_id UUID;
                v_date DATE;
                v_promoter_id UUID;
                v_signups NUMERIC;
                v_purchases NUMERIC;
                v_revenue NUMERIC;
                v_commission NUMERIC;
                v_created_at TIMESTAMPTZ;
                v_updated_at TIMESTAMPTZ;
                date_start TIMESTAMPTZ;
                date_end TIMESTAMPTZ;
            BEGIN
                v_promoter_id := COALESCE(NEW.promoter_id, OLD.promoter_id);
                v_date := DATE(COALESCE(NEW.created_at, OLD.created_at));
                date_start := v_date::timestamp;
                date_end := v_date::timestamp + INTERVAL '1 day';

                -- Early exit if no promoter_id
                IF v_promoter_id IS NULL THEN
                    RETURN COALESCE(NEW, OLD);
                END IF;

                -- Get all required data in a single optimized query
                WITH base_data AS (
                    SELECT 
                        COALESCE(
                            (SELECT l.program_id FROM link l WHERE l.link_id = COALESCE(NEW.link_id, OLD.link_id)),
                            (SELECT c.program_id FROM contact c WHERE c.contact_id = COALESCE(NEW.contact_id, OLD.contact_id))
                        ) as program_id,
                        p.created_at as promoter_created_at,
                        p.updated_at as promoter_updated_at
                    FROM promoter p
                    WHERE p.promoter_id = v_promoter_id
                ),
                daily_metrics AS (
                    SELECT 
                        COUNT(DISTINCT s.contact_id) as signups,
                        COUNT(DISTINCT pur.purchase_id) as purchases,
                        COALESCE(SUM(pur.amount), 0) as revenue,
                        COALESCE(SUM(com.amount), 0) as commission
                    FROM sign_up s
                    LEFT JOIN contact c ON s.contact_id = c.contact_id
                    LEFT JOIN purchase pur ON pur.contact_id = c.contact_id 
                        AND pur.promoter_id = v_promoter_id
                        AND pur.created_at >= date_start 
                        AND pur.created_at < date_end
                    LEFT JOIN commission com ON com.link_id = s.link_id
                        AND com.created_at >= date_start 
                        AND com.created_at < date_end
                    WHERE s.promoter_id = v_promoter_id
                        AND s.created_at >= date_start 
                        AND s.created_at < date_end
                        AND c.program_id = (SELECT program_id FROM base_data)
                )
                SELECT 
                    bd.program_id,
                    bd.promoter_created_at,
                    bd.promoter_updated_at,
                    dm.signups,
                    dm.purchases,
                    dm.revenue,
                    dm.commission
                INTO v_program_id, v_created_at, v_updated_at, v_signups, v_purchases, v_revenue, v_commission
                FROM base_data bd
                CROSS JOIN daily_metrics dm;

                -- Early exit if no program_id found
                IF v_program_id IS NULL THEN
                    RETURN COALESCE(NEW, OLD);
                END IF;

                -- Upsert into MV
                INSERT INTO promoter_analytics_day_wise_mv (
                    date, promoter_id, program_id,
                    revenue, commission, signups, purchases,
                    created_at, updated_at
                )
                VALUES (
                    v_date,
                    v_promoter_id,
                    v_program_id,
                    v_revenue,
                    v_commission,
                    v_signups,
                    v_purchases,
                    v_created_at,
                    v_updated_at
                )
                ON CONFLICT (date, promoter_id, program_id)
                DO UPDATE SET
                    revenue     = EXCLUDED.revenue,
                    commission  = EXCLUDED.commission,
                    signups     = EXCLUDED.signups,
                    purchases   = EXCLUDED.purchases,
                    updated_at  = now();

                RETURN COALESCE(NEW, OLD);
            END;
            $$ LANGUAGE plpgsql;
        `);

		await queryRunner.query(`
            -- Function to update promoter analytics day-wise when purchase is created/updated/deleted
            CREATE OR REPLACE FUNCTION update_promoter_analytics_from_purchase()
            RETURNS TRIGGER AS $$
            DECLARE
                v_program_id UUID;
                v_date DATE;
                v_promoter_id UUID;
                v_signups NUMERIC;
                v_purchases NUMERIC;
                v_revenue NUMERIC;
                v_commission NUMERIC;
                v_created_at TIMESTAMPTZ;
                v_updated_at TIMESTAMPTZ;
                date_start TIMESTAMPTZ;
                date_end TIMESTAMPTZ;
            BEGIN
                -- Resolve promoter_id & date once
                v_promoter_id := COALESCE(NEW.promoter_id, OLD.promoter_id);
                v_date := DATE(COALESCE(NEW.created_at, OLD.created_at));
                date_start := v_date::timestamp;
                date_end := v_date::timestamp + INTERVAL '1 day';

                -- Early exit if no promoter_id
                IF v_promoter_id IS NULL THEN
                    RETURN COALESCE(NEW, OLD);
                END IF;

                -- Get all required data in a single optimized query
                WITH base_data AS (
                    SELECT 
                        c.program_id,
                        p.created_at as promoter_created_at,
                        p.updated_at as promoter_updated_at
                    FROM contact c
                    JOIN promoter p ON p.promoter_id = v_promoter_id
                    WHERE c.contact_id = COALESCE(NEW.contact_id, OLD.contact_id)
                ),
                daily_metrics AS (
                    SELECT 
                        COUNT(DISTINCT s.contact_id) as signups,
                        COUNT(DISTINCT pur.purchase_id) as purchases,
                        COALESCE(SUM(pur.amount), 0) as revenue,
                        COALESCE(SUM(com.amount), 0) as commission
                    FROM sign_up s
                    LEFT JOIN contact c ON s.contact_id = c.contact_id
                    LEFT JOIN purchase pur ON pur.contact_id = c.contact_id 
                        AND pur.promoter_id = v_promoter_id
                        AND pur.created_at >= date_start 
                        AND pur.created_at < date_end
                    LEFT JOIN commission com ON com.link_id = s.link_id
                        AND com.created_at >= date_start 
                        AND com.created_at < date_end
                    WHERE s.promoter_id = v_promoter_id
                        AND s.created_at >= date_start 
                        AND s.created_at < date_end
                        AND c.program_id = (SELECT program_id FROM base_data)
                )
                SELECT 
                    bd.program_id,
                    bd.promoter_created_at,
                    bd.promoter_updated_at,
                    dm.signups,
                    dm.purchases,
                    dm.revenue,
                    dm.commission
                INTO v_program_id, v_created_at, v_updated_at, v_signups, v_purchases, v_revenue, v_commission
                FROM base_data bd
                CROSS JOIN daily_metrics dm;

                -- Early exit if no program_id found
                IF v_program_id IS NULL THEN
                    RETURN COALESCE(NEW, OLD);
                END IF;

                -- Upsert into MV
                INSERT INTO promoter_analytics_day_wise_mv (
                    date, promoter_id, program_id,
                    revenue, commission, signups, purchases,
                    created_at, updated_at
                )
                VALUES (
                    v_date,
                    v_promoter_id,
                    v_program_id,
                    v_revenue,
                    v_commission,
                    v_signups,
                    v_purchases,
                    v_created_at,
                    v_updated_at
                )
                ON CONFLICT (date, promoter_id, program_id) 
                DO UPDATE SET 
                    revenue = EXCLUDED.revenue,
                    commission = EXCLUDED.commission,
                    signups = EXCLUDED.signups,
                    purchases = EXCLUDED.purchases,
                    updated_at = now();
                
                RETURN COALESCE(NEW, OLD);
            END;
            $$ LANGUAGE plpgsql;
        `);

		await queryRunner.query(`
            -- Function to update promoter analytics day-wise when commission is created/updated/deleted
            CREATE OR REPLACE FUNCTION update_promoter_analytics_from_commission()
            RETURNS TRIGGER AS $$
            DECLARE
                v_program_id UUID;
                v_promoter_id UUID;
                v_date DATE;
                v_signups NUMERIC;
                v_purchases NUMERIC;
                v_revenue NUMERIC;
                v_commission NUMERIC;
                v_created_at TIMESTAMPTZ;
                v_updated_at TIMESTAMPTZ;
                date_start TIMESTAMPTZ;
                date_end TIMESTAMPTZ;
            BEGIN
                -- Resolve promoter_id & date once
                v_promoter_id := COALESCE(NEW.promoter_id, OLD.promoter_id);
                v_date := DATE(COALESCE(NEW.created_at, OLD.created_at));
                date_start := v_date::timestamp;
                date_end := v_date::timestamp + INTERVAL '1 day';

                -- Early exit if no promoter_id
                IF v_promoter_id IS NULL THEN
                    RETURN COALESCE(NEW, OLD);
                END IF;

                -- Get all required data in a single optimized query
                WITH base_data AS (
                    SELECT 
                        l.program_id,
                        p.created_at as promoter_created_at,
                        p.updated_at as promoter_updated_at
                    FROM link l
                    JOIN promoter p ON p.promoter_id = v_promoter_id
                    WHERE l.link_id = COALESCE(NEW.link_id, OLD.link_id)
                ),
                daily_metrics AS (
                    SELECT 
                        COUNT(DISTINCT s.contact_id) as signups,
                        COUNT(DISTINCT pur.purchase_id) as purchases,
                        COALESCE(SUM(pur.amount), 0) as revenue,
                        COALESCE(SUM(com.amount), 0) as commission
                    FROM sign_up s
                    LEFT JOIN contact c ON s.contact_id = c.contact_id
                    LEFT JOIN purchase pur ON pur.contact_id = c.contact_id 
                        AND pur.promoter_id = v_promoter_id
                        AND pur.created_at >= date_start 
                        AND pur.created_at < date_end
                    LEFT JOIN commission com ON com.link_id = s.link_id
                        AND com.created_at >= date_start 
                        AND com.created_at < date_end
                    WHERE s.promoter_id = v_promoter_id
                        AND s.created_at >= date_start 
                        AND s.created_at < date_end
                        AND c.program_id = (SELECT program_id FROM base_data)
                )
                SELECT 
                    bd.program_id,
                    bd.promoter_created_at,
                    bd.promoter_updated_at,
                    dm.signups,
                    dm.purchases,
                    dm.revenue,
                    dm.commission
                INTO v_program_id, v_created_at, v_updated_at, v_signups, v_purchases, v_revenue, v_commission
                FROM base_data bd
                CROSS JOIN daily_metrics dm;

                -- Early exit if no program_id found
                IF v_program_id IS NULL THEN
                    RETURN COALESCE(NEW, OLD);
                END IF;

                -- Upsert into MV
                INSERT INTO promoter_analytics_day_wise_mv (
                    date, promoter_id, program_id,
                    revenue, commission, signups, purchases,
                    created_at, updated_at
                )
                VALUES (
                    v_date,
                    v_promoter_id,
                    v_program_id,
                    v_revenue,
                    v_commission,
                    v_signups,
                    v_purchases,
                    v_created_at,
                    v_updated_at
                )
                ON CONFLICT (date, promoter_id, program_id) 
                DO UPDATE SET 
                    revenue = EXCLUDED.revenue,
                    commission = EXCLUDED.commission,
                    signups = EXCLUDED.signups,
                    purchases = EXCLUDED.purchases,
                    updated_at = now();
                
                RETURN COALESCE(NEW, OLD);
            END;
            $$ LANGUAGE plpgsql;
        `);

		// Create triggers
		await queryRunner.query(`
            -- Create trigger to automatically update aggregated data
            CREATE TRIGGER trigger_aggregate_promoter_analytics
                AFTER INSERT OR UPDATE OR DELETE ON promoter_analytics_day_wise_mv
                FOR EACH ROW
                EXECUTE FUNCTION aggregate_promoter_analytics_from_day_wise();
        `);

		await queryRunner.query(`
            -- Create triggers for signup table
            CREATE TRIGGER trigger_update_promoter_analytics_from_signup
                AFTER INSERT OR UPDATE OR DELETE ON sign_up
                FOR EACH ROW
                EXECUTE FUNCTION update_promoter_analytics_from_signup();
        `);

		await queryRunner.query(`
            -- Create triggers for purchase table
            CREATE TRIGGER trigger_update_promoter_analytics_from_purchase
                AFTER INSERT OR UPDATE OR DELETE ON purchase
                FOR EACH ROW
                EXECUTE FUNCTION update_promoter_analytics_from_purchase();
        `);

		await queryRunner.query(`
            -- Create triggers for commission table
            CREATE TRIGGER trigger_update_promoter_analytics_from_commission
                AFTER INSERT OR UPDATE OR DELETE ON commission
                FOR EACH ROW
                EXECUTE FUNCTION update_promoter_analytics_from_commission();
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Drop triggers first
		await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_promoter_analytics_from_commission ON commission;
        `);

		await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_promoter_analytics_from_purchase ON purchase;
        `);

		await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_promoter_analytics_from_signup ON sign_up;
        `);

		await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_aggregate_promoter_analytics ON promoter_analytics_day_wise_mv;
        `);

		// Drop functions
		await queryRunner.query(`
            DROP FUNCTION IF EXISTS update_promoter_analytics_from_commission();
        `);

		await queryRunner.query(`
            DROP FUNCTION IF EXISTS update_promoter_analytics_from_purchase();
        `);

		await queryRunner.query(`
            DROP FUNCTION IF EXISTS update_promoter_analytics_from_signup();
        `);

		await queryRunner.query(`
            DROP FUNCTION IF EXISTS aggregate_promoter_analytics_from_day_wise();
        `);

		// Drop indexes for promoter_analytics_day_wise_mv
		await queryRunner.query(`DROP INDEX IF EXISTS idx_promoter_analytics_day_wise_date;`);
		await queryRunner.query(`DROP INDEX IF EXISTS idx_promoter_analytics_day_wise_promoter;`);
		await queryRunner.query(`DROP INDEX IF EXISTS idx_promoter_analytics_day_wise_program;`);
		await queryRunner.query(`DROP INDEX IF EXISTS idx_promoter_analytics_day_wise_date_promoter;`);
		await queryRunner.query(`DROP INDEX IF EXISTS idx_promoter_analytics_day_wise_date_program;`);
		await queryRunner.query(`DROP INDEX IF EXISTS idx_promoter_analytics_day_wise_date_promoter_program;`);

		// Drop indexes for promoter_analytics_mv
		await queryRunner.query(`DROP INDEX IF EXISTS idx_promoter_analytics_promoter_id;`);
		await queryRunner.query(`DROP INDEX IF EXISTS idx_promoter_analytics_program_id;`);
		await queryRunner.query(`DROP INDEX IF EXISTS idx_promoter_analytics_created_at;`);

		// Drop tables
		await queryRunner.query(`
            DROP TABLE IF EXISTS promoter_analytics_day_wise_mv;
        `);

		await queryRunner.query(`
            DROP TABLE IF EXISTS promoter_analytics_mv;
        `);
	}
}
