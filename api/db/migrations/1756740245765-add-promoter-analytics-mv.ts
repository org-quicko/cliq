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
                -- Delete existing aggregated data for this promoter-program combination
                DELETE FROM promoter_analytics_mv 
                WHERE promoter_id = NEW.promoter_id AND program_id = NEW.program_id;

                -- Insert aggregated data from day-wise summary
                INSERT INTO promoter_analytics_mv (promoter_id, program_id, total_revenue, total_commission, total_signups, total_purchases, created_at, updated_at)
                SELECT 
                    promoter_id,
                    program_id,
                    SUM(daily_revenue) as total_revenue,
                    SUM(daily_commission) as total_commission,
                    SUM(daily_signups) as total_signups,
                    SUM(daily_purchases) as total_purchases,
                    MIN(created_at) as created_at,
                    MAX(updated_at) as updated_at
                FROM promoter_analytics_day_wise_mv
                WHERE promoter_id = NEW.promoter_id AND program_id = NEW.program_id
                GROUP BY promoter_id, program_id;

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
            BEGIN
                -- Get program_id and date for the operation
                IF TG_OP = 'DELETE' THEN
                    SELECT c.program_id INTO v_program_id FROM contact c WHERE c.contact_id = OLD.contact_id;
                    v_date := DATE(OLD.created_at);
                ELSE
                    SELECT c.program_id INTO v_program_id FROM contact c WHERE c.contact_id = NEW.contact_id;
                    v_date := DATE(NEW.created_at);
                END IF;

                IF TG_OP = 'DELETE' THEN
                    -- Recalculate daily signups count for the day
                    UPDATE promoter_analytics_day_wise_mv 
                    SET 
                        daily_signups = (
                            SELECT COUNT(s.contact_id)
                            FROM sign_up s
                            JOIN contact c ON s.contact_id = c.contact_id
                            WHERE c.program_id = promoter_analytics_day_wise_mv.program_id 
                            AND s.promoter_id = promoter_analytics_day_wise_mv.promoter_id
                            AND DATE(s.created_at) = promoter_analytics_day_wise_mv.date
                        ),
                        updated_at = now()
                    WHERE promoter_id = OLD.promoter_id 
                    AND program_id = v_program_id
                    AND date = v_date;

                    RETURN OLD;

                ELSIF TG_OP = 'UPDATE' THEN
                    UPDATE promoter_analytics_day_wise_mv 
                    SET 
                        daily_signups = (
                            SELECT COUNT(s.contact_id)
                            FROM sign_up s
                            JOIN contact c ON s.contact_id = c.contact_id
                            WHERE c.program_id = promoter_analytics_day_wise_mv.program_id 
                            AND s.promoter_id = promoter_analytics_day_wise_mv.promoter_id
                            AND DATE(s.created_at) = promoter_analytics_day_wise_mv.date
                        ),
                        updated_at = now()
                    WHERE promoter_id = OLD.promoter_id 
                    AND program_id = v_program_id
                    AND date = v_date;
                        
                    RETURN NEW;

                ELSIF TG_OP = 'INSERT' THEN
                    -- Insert or update daily signups count
                    INSERT INTO promoter_analytics_day_wise_mv (
                        date, promoter_id, program_id, daily_revenue, daily_commission, daily_signups, daily_purchases, created_at, updated_at
                    )
                    SELECT 
                        v_date,
                        NEW.promoter_id,
                        v_program_id,
                        (
                            SELECT COALESCE(SUM(amount), 0)
                            FROM purchase p
                            JOIN contact c ON p.contact_id = c.contact_id
                            WHERE c.program_id = v_program_id
                            AND p.promoter_id = NEW.promoter_id
                            AND DATE(p.created_at) = v_date
                        ),
                        (
                            SELECT COALESCE(SUM(comm.amount), 0)
                            FROM commission comm
                            JOIN link l ON comm.link_id = l.link_id
                            WHERE l.program_id = v_program_id 
                            AND l.promoter_id = NEW.promoter_id
                            AND DATE(comm.created_at) = v_date
                        ),
                        (
                            SELECT COUNT(s2.contact_id)
                            FROM sign_up s2
                            JOIN contact c2 ON s2.contact_id = c2.contact_id
                            WHERE c2.program_id = v_program_id 
                            AND s2.promoter_id = NEW.promoter_id
                            AND DATE(s2.created_at) = v_date
                        ),
                        (
                            SELECT COUNT(p2.purchase_id)
                            FROM purchase p2
                            JOIN contact c2 ON p2.contact_id = c2.contact_id
                            WHERE c2.program_id = v_program_id 
                            AND p2.promoter_id = NEW.promoter_id
                            AND DATE(p2.created_at) = v_date
                        ),
                        now(),
                        now()
                    ON CONFLICT (date, promoter_id, program_id) 
                    DO UPDATE SET 
                        daily_revenue = (
                            SELECT COALESCE(SUM(amount), 0)
                            FROM purchase p
                            JOIN contact c ON p.contact_id = c.contact_id
                            WHERE c.program_id = EXCLUDED.program_id
                            AND p.promoter_id = EXCLUDED.promoter_id
                            AND DATE(p.created_at) = EXCLUDED.date
                        ),
                        daily_commission = (
                            SELECT COALESCE(SUM(comm.amount), 0)
                            FROM commission comm
                            JOIN link l ON comm.link_id = l.link_id
                            WHERE l.program_id = EXCLUDED.program_id 
                            AND l.promoter_id = EXCLUDED.promoter_id
                            AND DATE(comm.created_at) = EXCLUDED.date
                        ),
                        daily_signups = (
                            SELECT COUNT(s2.contact_id)
                            FROM sign_up s2
                            JOIN contact c2 ON s2.contact_id = c2.contact_id
                            WHERE c2.program_id = EXCLUDED.program_id 
                            AND s2.promoter_id = EXCLUDED.promoter_id
                            AND DATE(s2.created_at) = EXCLUDED.date
                        ),
                        daily_purchases = (
                            SELECT COUNT(p2.purchase_id)
                            FROM purchase p2
                            JOIN contact c2 ON p2.contact_id = c2.contact_id
                            WHERE c2.program_id = EXCLUDED.program_id 
                            AND p2.promoter_id = EXCLUDED.promoter_id
                            AND DATE(p2.created_at) = EXCLUDED.date
                        ),
                        updated_at = now();
                    
                    RETURN NEW;
                END IF;
                
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        `);

		await queryRunner.query(`
            -- Function to update promoter analytics day-wise when purchase is created/updated/deleted
            CREATE OR REPLACE FUNCTION update_promoter_analytics_from_purchase()
            RETURNS TRIGGER AS $$
            BEGIN
                IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
                    -- Recalculate daily purchases count for the day
                    UPDATE promoter_analytics_day_wise_mv 
                    SET 
                        daily_purchases = (
                            SELECT COUNT(p.purchase_id)
                            FROM purchase p 
                            JOIN contact c ON p.contact_id = c.contact_id
                            WHERE c.program_id = promoter_analytics_day_wise_mv.program_id 
                            AND p.promoter_id = promoter_analytics_day_wise_mv.promoter_id
                            AND DATE(p.created_at) = promoter_analytics_day_wise_mv.date
                        ),
                        daily_commission = (
                            SELECT COALESCE(SUM(comm.amount), 0)
                            FROM commission comm
                            JOIN link l ON comm.link_id = l.link_id
                            WHERE l.program_id = promoter_analytics_day_wise_mv.program_id 
                            AND comm.promoter_id = promoter_analytics_day_wise_mv.promoter_id
                            AND DATE(comm.created_at) = DATE(promoter_analytics_day_wise_mv.date)
                        ),
                        daily_revenue = (
                           SELECT SUM(p.amount)
                            FROM purchase p 
                            JOIN contact c ON p.contact_id = c.contact_id
                            WHERE c.program_id = promoter_analytics_day_wise_mv.program_id 
                            AND p.promoter_id = promoter_analytics_day_wise_mv.promoter_id
                            AND DATE(p.created_at) = promoter_analytics_day_wise_mv.date
                        ),
                        updated_at = now()
                    WHERE promoter_id = promoter_analytics_day_wise_mv.promoter_id 
                        AND program_id = promoter_analytics_day_wise_mv.program_id
                    AND date = DATE(promoter_analytics_day_wise_mv.date);

                    RETURN OLD;

                ELSIF TG_OP = 'INSERT' THEN
                    -- Insert or update daily purchases count
                    INSERT INTO promoter_analytics_day_wise_mv (
                        date, promoter_id, program_id, daily_revenue, daily_commission, daily_signups, daily_purchases, created_at, updated_at
                    )
                    SELECT 
                        DATE(NEW.created_at),
                        NEW.promoter_id,
                        c.program_id,
                        (
                            SELECT COALESCE(SUM(p2.amount), 0)
                            FROM purchase p2
                            JOIN contact c2 ON p2.contact_id = c2.contact_id
                            WHERE program_id = c.program_id 
                            AND promoter_id = NEW.promoter_id
                            AND DATE(p2.created_at) = DATE(NEW.created_at)
                        ),
                        (
                            SELECT COALESCE(SUM(amount), 0)
                            FROM commission comm
                            JOIN link l ON comm.link_id = l.link_id
                            WHERE program_id = c2.program_id 
                            AND l.promoter_id = NEW.promoter_id
                            AND DATE(comm.created_at) = DATE(NEW.created_at)
                        ),
                        (
                            SELECT COUNT(s2.contact_id)
                            FROM sign_up s2
                            JOIN contact c2 ON s2.contact_id = c2.contact_id
                            WHERE c2.program_id = c2.program_id 
                            AND s2.promoter_id = NEW.promoter_id
                            AND DATE(s2.created_at) = DATE(NEW.created_at)
                        ),
                        (
                            SELECT COUNT(p2.purchase_id)
                            FROM purchase p2
                            JOIN contact c2 ON p2.contact_id = c2.contact_id
                            WHERE c2.program_id = c2.program_id 
                            AND p2.promoter_id = NEW.promoter_id
                            AND DATE(p2.created_at) = DATE(NEW.created_at)
                        ),
                        p.created_at,
                        p.updated_at
                    FROM contact c
                    JOIN promoter p ON p.promoter_id = NEW.promoter_id
                    WHERE c.contact_id = NEW.contact_id
                    ON CONFLICT (date, promoter_id, program_id) 
                    DO UPDATE SET 
                        daily_revenue = (
                            SELECT COALESCE(SUM(p2.amount), 0)
                            FROM purchase p2
                            JOIN contact c2 ON p2.contact_id = c2.contact_id
                            WHERE c2.program_id = EXCLUDED.program_id 
                            AND p2.promoter_id = EXCLUDED.promoter_id
                            AND DATE(p2.created_at) = EXCLUDED.date
                        ),
                        daily_commission = (
                            SELECT COALESCE(SUM(comm.amount), 0)
                            FROM commission comm
                            JOIN link l ON comm.link_id = l.link_id
                            WHERE program_id = EXCLUDED.program_id 
                            AND l.promoter_id = EXCLUDED.promoter_id
                            AND DATE(comm.created_at) = EXCLUDED.date
                        ),
                        daily_signups = (
                            SELECT COUNT(s2.contact_id)
                            FROM sign_up s2
                            JOIN contact c2 ON s2.contact_id = c2.contact_id
                            WHERE c2.program_id = EXCLUDED.program_id 
                            AND s2.promoter_id = EXCLUDED.promoter_id
                            AND DATE(s2.created_at) = EXCLUDED.date
                        ),
                        daily_purchases = (
                            SELECT COUNT(p2.purchase_id)
                            FROM purchase p2
                            JOIN contact c2 ON p2.contact_id = c2.contact_id
                            WHERE c2.program_id = EXCLUDED.program_id 
                            AND p2.promoter_id = EXCLUDED.promoter_id
                            AND DATE(p2.created_at) = EXCLUDED.date
                        ),
                        updated_at = now();
                    
                    RETURN NEW;
                END IF;
                
                RETURN NULL;
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
            BEGIN
                -- Get program_id, promoter_id and date for the operation
                IF TG_OP = 'DELETE' THEN
                    SELECT l.program_id, l.promoter_id INTO v_program_id, v_promoter_id FROM link l WHERE l.link_id = OLD.link_id;
                    v_date := DATE(OLD.created_at);
                ELSE
                    SELECT l.program_id, l.promoter_id INTO v_program_id, v_promoter_id FROM link l WHERE l.link_id = NEW.link_id;
                    v_date := DATE(NEW.created_at);
                END IF;

                IF TG_OP = 'DELETE' THEN
                    -- Recalculate daily commission amount for the day
                    UPDATE promoter_analytics_day_wise_mv 
                    SET 
                        daily_commission = (
                            SELECT COALESCE(SUM(comm.amount), 0)
                            FROM commission comm
                            JOIN link l ON comm.link_id = l.link_id
                            WHERE l.program_id = promoter_analytics_day_wise_mv.program_id 
                            AND l.promoter_id = promoter_analytics_day_wise_mv.promoter_id
                            AND DATE(comm.created_at) = promoter_analytics_day_wise_mv.date
                        ),
                        updated_at = now()
                    WHERE promoter_id = v_promoter_id 
                    AND program_id = v_program_id
                    AND date = v_date;

                    RETURN OLD;

                ELSIF TG_OP = 'UPDATE' THEN
                    UPDATE promoter_analytics_day_wise_mv 
                    SET 
                        daily_commission = (
                            SELECT COALESCE(SUM(comm.amount), 0)
                            FROM commission comm
                            JOIN link l ON comm.link_id = l.link_id
                            WHERE l.program_id = promoter_analytics_day_wise_mv.program_id 
                            AND l.promoter_id = promoter_analytics_day_wise_mv.promoter_id
                            AND DATE(comm.created_at) = promoter_analytics_day_wise_mv.date
                        ),
                        updated_at = now()
                    WHERE promoter_id = v_promoter_id 
                    AND program_id = v_program_id
                    AND date = v_date;
                        
                    RETURN NEW;

                ELSIF TG_OP = 'INSERT' THEN
                    -- Insert or update daily commission amount
                    INSERT INTO promoter_analytics_day_wise_mv (
                        date, promoter_id, program_id, daily_revenue, daily_commission, daily_signups, daily_purchases, created_at, updated_at
                    )
                    SELECT 
                        v_date,
                        v_promoter_id,
                        v_program_id,
                        (
                            SELECT COALESCE(SUM(p.amount), 0)
                            FROM purchase p
                            JOIN contact c ON p.contact_id = c.contact_id
                            WHERE c.program_id = v_program_id 
                            AND p.promoter_id = v_promoter_id
                            AND DATE(p.created_at) = v_date
                        ),
                        (
                            SELECT COALESCE(SUM(comm.amount), 0)
                            FROM commission comm
                            JOIN link l ON comm.link_id = l.link_id
                            WHERE l.program_id = v_program_id 
                            AND l.promoter_id = v_promoter_id
                            AND DATE(comm.created_at) = v_date
                        ),
                        (
                            SELECT COUNT(s.contact_id)
                            FROM sign_up s
                            JOIN contact c ON s.contact_id = c.contact_id
                            WHERE c.program_id = v_program_id 
                            AND s.promoter_id = v_promoter_id
                            AND DATE(s.created_at) = v_date
                        ),
                        (
                            SELECT COUNT(p2.purchase_id)
                            FROM purchase p2
                            JOIN contact c2 ON p2.contact_id = c2.contact_id
                            WHERE c2.program_id = v_program_id 
                            AND p2.promoter_id = v_promoter_id
                            AND DATE(p2.created_at) = v_date
                        ),
                        now(),
                        now()
                    ON CONFLICT (date, promoter_id, program_id) 
                    DO UPDATE SET 
                        daily_revenue = (
                            SELECT COALESCE(SUM(p.amount), 0)
                            FROM purchase p
                            JOIN contact c ON p.contact_id = c.contact_id
                            WHERE c.program_id = EXCLUDED.program_id 
                            AND p.promoter_id = EXCLUDED.promoter_id
                            AND DATE(p.created_at) = EXCLUDED.date
                        ),
                        daily_commission = (
                            SELECT COALESCE(SUM(comm.amount), 0)
                            FROM commission comm
                            JOIN link l ON comm.link_id = l.link_id
                            WHERE l.program_id = EXCLUDED.program_id 
                            AND l.promoter_id = EXCLUDED.promoter_id
                            AND DATE(comm.created_at) = EXCLUDED.date
                        ),
                        daily_signups = (
                            SELECT COUNT(s.contact_id)
                            FROM sign_up s
                            JOIN contact c ON s.contact_id = c.contact_id
                            WHERE c.program_id = EXCLUDED.program_id 
                            AND s.promoter_id = EXCLUDED.promoter_id
                            AND DATE(s.created_at) = EXCLUDED.date
                        ),
                        daily_purchases = (
                            SELECT COUNT(p2.purchase_id)
                            FROM purchase p2
                            JOIN contact c2 ON p2.contact_id = c2.contact_id
                            WHERE c2.program_id = EXCLUDED.program_id 
                            AND p2.promoter_id = EXCLUDED.promoter_id
                            AND DATE(p2.created_at) = EXCLUDED.date
                        ),
                        updated_at = now();
                    
                    RETURN NEW;
                END IF;
                
                RETURN NULL;
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
