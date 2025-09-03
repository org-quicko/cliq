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
                daily_revenue NUMERIC DEFAULT 0,
                daily_commission NUMERIC DEFAULT 0,
                daily_signups NUMERIC DEFAULT 0,
                daily_purchases NUMERIC DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                PRIMARY KEY (date, promoter_id, program_id)
            );
        `);

		// Create indexes for performance
		await queryRunner.query(`
            CREATE INDEX idx_promoter_analytics_promoter_id ON promoter_analytics_mv (promoter_id);
        `);

		await queryRunner.query(`
            CREATE INDEX idx_promoter_analytics_program_id ON promoter_analytics_mv (program_id);
        `);

		await queryRunner.query(`
            CREATE INDEX idx_promoter_analytics_day_wise_date ON promoter_analytics_day_wise_mv (date);
        `);

		await queryRunner.query(`
            CREATE INDEX idx_promoter_analytics_day_wise_promoter ON promoter_analytics_day_wise_mv (promoter_id);
        `);

		await queryRunner.query(`
            CREATE INDEX idx_promoter_analytics_day_wise_program ON promoter_analytics_day_wise_mv (program_id);
        `);

		await queryRunner.query(`
            CREATE INDEX idx_promoter_analytics_day_wise_date_promoter ON promoter_analytics_day_wise_mv (date, promoter_id);
        `);

		await queryRunner.query(`
            CREATE INDEX idx_promoter_analytics_day_wise_date_program ON promoter_analytics_day_wise_mv (date, program_id);
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
                    (SELECT COALESCE(SUM(daily_revenue), 0) FROM promoter_analytics_day_wise_mv WHERE promoter_id = NEW.promoter_id AND program_id = NEW.program_id),
                    (SELECT COALESCE(SUM(daily_commission), 0) FROM promoter_analytics_day_wise_mv WHERE promoter_id = NEW.promoter_id AND program_id = NEW.program_id),
                    (SELECT COALESCE(SUM(daily_signups), 0) FROM promoter_analytics_day_wise_mv WHERE promoter_id = NEW.promoter_id AND program_id = NEW.program_id),
                    (SELECT COALESCE(SUM(daily_purchases), 0) FROM promoter_analytics_day_wise_mv WHERE promoter_id = NEW.promoter_id AND program_id = NEW.program_id),
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
                daily_metrics RECORD;
                promoter_timestamps RECORD;
            BEGIN
                -- Get program_id and date once
                IF TG_OP = 'DELETE' THEN
                    -- For DELETE operations, try to get program_id from the signup record itself
                    SELECT l.program_id INTO v_program_id 
                    FROM link l 
                    WHERE l.link_id = OLD.link_id;
                    
                    -- If still no program_id, return early
                    IF v_program_id IS NULL THEN
                        RETURN OLD;
                    END IF;
                    
                    v_date := DATE(OLD.created_at);
                ELSE
                    SELECT c.program_id INTO v_program_id FROM contact c WHERE c.contact_id = NEW.contact_id;
                    v_date := DATE(NEW.created_at);
                END IF;

                -- If no program_id found, return early
                IF v_program_id IS NULL THEN
                    RETURN COALESCE(NEW, OLD);
                END IF;

                -- Get promoter timestamps
                SELECT p.created_at, p.updated_at
                INTO promoter_timestamps
                FROM promoter p
                WHERE p.promoter_id = COALESCE(NEW.promoter_id, OLD.promoter_id);

                -- Calculate metrics separately to avoid join issues
                WITH signup_count AS (
                    SELECT COUNT(*) as daily_signups
                    FROM sign_up s
                    JOIN contact c ON s.contact_id = c.contact_id
                    WHERE c.program_id = v_program_id 
                    AND s.promoter_id = COALESCE(NEW.promoter_id, OLD.promoter_id)
                    AND DATE(s.created_at) = v_date
                ),
                purchase_metrics AS (
                    SELECT 
                        COUNT(p.purchase_id) as daily_purchases,
                        COALESCE(SUM(p.amount), 0) as daily_revenue
                    FROM purchase p
                    JOIN contact c ON p.contact_id = c.contact_id
                    WHERE c.program_id = v_program_id 
                    AND p.promoter_id = COALESCE(NEW.promoter_id, OLD.promoter_id)
                    AND DATE(p.created_at) = v_date
                ),
                commission_metrics AS (
                    SELECT COALESCE(SUM(c.amount), 0) as daily_commission
                    FROM commission c
                    JOIN link l ON c.link_id = l.link_id
                    WHERE l.program_id = v_program_id 
                    AND l.promoter_id = COALESCE(NEW.promoter_id, OLD.promoter_id)
                    AND DATE(c.created_at) = v_date
                )
                SELECT 
                    s.daily_signups,
                    p.daily_purchases,
                    p.daily_revenue,
                    c.daily_commission
                INTO daily_metrics
                FROM signup_count s
                CROSS JOIN purchase_metrics p
                CROSS JOIN commission_metrics c;

                INSERT INTO promoter_analytics_day_wise_mv (
                    date, promoter_id, program_id, daily_revenue, daily_commission, daily_signups, daily_purchases, created_at, updated_at
                ) VALUES (
                    v_date,
                    COALESCE(NEW.promoter_id, OLD.promoter_id),
                    v_program_id,
                    daily_metrics.daily_revenue,
                    daily_metrics.daily_commission,
                    daily_metrics.daily_signups,
                    daily_metrics.daily_purchases,
                    promoter_timestamps.created_at,
                    promoter_timestamps.updated_at
                )
                ON CONFLICT (date, promoter_id, program_id) 
                DO UPDATE SET 
                    daily_revenue = EXCLUDED.daily_revenue,
                    daily_commission = EXCLUDED.daily_commission,
                    daily_signups = EXCLUDED.daily_signups,
                    daily_purchases = EXCLUDED.daily_purchases,
                    updated_at = now();
                
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
                daily_metrics RECORD;
                promoter_timestamps RECORD;
            BEGIN
                SELECT c.program_id INTO v_program_id 
                FROM contact c 
                WHERE c.contact_id = COALESCE(NEW.contact_id, OLD.contact_id);
                
                v_date := DATE(COALESCE(NEW.created_at, OLD.created_at));

                -- Get promoter timestamps
                SELECT p.created_at, p.updated_at
                INTO promoter_timestamps
                FROM promoter p
                WHERE p.promoter_id = COALESCE(NEW.promoter_id, OLD.promoter_id);

                -- Calculate metrics separately to avoid join issues
                WITH signup_count AS (
                    SELECT COUNT(*) as daily_signups
                    FROM sign_up s
                    JOIN contact c ON s.contact_id = c.contact_id
                    WHERE c.program_id = v_program_id 
                    AND s.promoter_id = COALESCE(NEW.promoter_id, OLD.promoter_id)
                    AND DATE(s.created_at) = v_date
                ),
                purchase_metrics AS (
                    SELECT 
                        COUNT(p.purchase_id) as daily_purchases,
                        COALESCE(SUM(p.amount), 0) as daily_revenue
                    FROM purchase p
                    JOIN contact c ON p.contact_id = c.contact_id
                    WHERE c.program_id = v_program_id 
                    AND p.promoter_id = COALESCE(NEW.promoter_id, OLD.promoter_id)
                    AND DATE(p.created_at) = v_date
                ),
                commission_metrics AS (
                    SELECT COALESCE(SUM(c.amount), 0) as daily_commission
                    FROM commission c
                    JOIN link l ON c.link_id = l.link_id
                    WHERE l.program_id = v_program_id 
                    AND l.promoter_id = COALESCE(NEW.promoter_id, OLD.promoter_id)
                    AND DATE(c.created_at) = v_date
                )
                SELECT 
                    s.daily_signups,
                    p.daily_purchases,
                    p.daily_revenue,
                    c.daily_commission
                INTO daily_metrics
                FROM signup_count s
                CROSS JOIN purchase_metrics p
                CROSS JOIN commission_metrics c;

                INSERT INTO promoter_analytics_day_wise_mv (
                    date, promoter_id, program_id, daily_revenue, daily_commission, daily_signups, daily_purchases, created_at, updated_at
                ) VALUES (
                    v_date,
                    COALESCE(NEW.promoter_id, OLD.promoter_id),
                    v_program_id,
                    daily_metrics.daily_revenue,
                    daily_metrics.daily_commission,
                    daily_metrics.daily_signups,
                    daily_metrics.daily_purchases,
                    promoter_timestamps.created_at,
                    promoter_timestamps.updated_at
                )
                ON CONFLICT (date, promoter_id, program_id) 
                DO UPDATE SET 
                    daily_revenue = EXCLUDED.daily_revenue,
                    daily_commission = EXCLUDED.daily_commission,
                    daily_signups = EXCLUDED.daily_signups,
                    daily_purchases = EXCLUDED.daily_purchases,
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
                daily_metrics RECORD;
                promoter_timestamps RECORD;
            BEGIN
                -- Get program_id, promoter_id and date once
                IF TG_OP = 'DELETE' THEN
                    SELECT l.program_id, l.promoter_id INTO v_program_id, v_promoter_id FROM link l WHERE l.link_id = OLD.link_id;
                    v_date := DATE(OLD.created_at);
                ELSE
                    SELECT l.program_id, l.promoter_id INTO v_program_id, v_promoter_id FROM link l WHERE l.link_id = NEW.link_id;
                    v_date := DATE(NEW.created_at);
                END IF;

                -- Get promoter timestamps
                SELECT p.created_at, p.updated_at
                INTO promoter_timestamps
                FROM promoter p
                WHERE p.promoter_id = v_promoter_id;

                -- Calculate metrics separately to avoid join issues
                WITH signup_count AS (
                    SELECT COUNT(*) as daily_signups
                    FROM sign_up s
                    JOIN link l ON s.link_id = l.link_id
                    WHERE l.program_id = v_program_id 
                    AND l.promoter_id = v_promoter_id
                    AND DATE(s.created_at) = v_date
                ),
                purchase_metrics AS (
                    SELECT 
                        COUNT(p.purchase_id) as daily_purchases,
                        COALESCE(SUM(p.amount), 0) as daily_revenue
                    FROM purchase p
                    JOIN contact c ON p.contact_id = c.contact_id
                    WHERE c.program_id = v_program_id 
                    AND p.promoter_id = v_promoter_id
                    AND DATE(p.created_at) = v_date
                ),
                commission_metrics AS (
                    SELECT COALESCE(SUM(c.amount), 0) as daily_commission
                    FROM commission c
                    JOIN link l ON c.link_id = l.link_id
                    WHERE l.program_id = v_program_id 
                    AND l.promoter_id = v_promoter_id
                    AND DATE(c.created_at) = v_date
                )
                SELECT 
                    s.daily_signups,
                    p.daily_purchases,
                    p.daily_revenue,
                    c.daily_commission
                INTO daily_metrics
                FROM signup_count s
                CROSS JOIN purchase_metrics p
                CROSS JOIN commission_metrics c;

                INSERT INTO promoter_analytics_day_wise_mv (
                    date, promoter_id, program_id, daily_revenue, daily_commission, daily_signups, daily_purchases, created_at, updated_at
                ) VALUES (
                    v_date,
                    v_promoter_id,
                    v_program_id,
                    daily_metrics.daily_revenue,
                    daily_metrics.daily_commission,
                    daily_metrics.daily_signups,
                    daily_metrics.daily_purchases,
                    promoter_timestamps.created_at,
                    promoter_timestamps.updated_at
                )
                ON CONFLICT (date, promoter_id, program_id) 
                DO UPDATE SET 
                    daily_revenue = EXCLUDED.daily_revenue,
                    daily_commission = EXCLUDED.daily_commission,
                    daily_signups = EXCLUDED.daily_signups,
                    daily_purchases = EXCLUDED.daily_purchases,
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

		// Drop tables
		await queryRunner.query(`
            DROP TABLE IF EXISTS promoter_analytics_day_wise_mv;
        `);

		await queryRunner.query(`
            DROP TABLE IF EXISTS promoter_analytics_mv;
        `);
	}
}
