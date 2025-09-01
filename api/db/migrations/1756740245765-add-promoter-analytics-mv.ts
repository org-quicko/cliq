import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPromoterAnalyticsMv1756740245765 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create promoter analytics tables
        await queryRunner.query(`
            -- Overall promoter analytics table
            CREATE TABLE promoter_analytics (
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
            CREATE TABLE promoter_analytics_day_wise (
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
            CREATE INDEX idx_promoter_analytics_promoter_id ON promoter_analytics (promoter_id);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_promoter_analytics_program_id ON promoter_analytics (program_id);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_promoter_analytics_day_wise_date ON promoter_analytics_day_wise (date);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_promoter_analytics_day_wise_promoter ON promoter_analytics_day_wise (promoter_id);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_promoter_analytics_day_wise_program ON promoter_analytics_day_wise (program_id);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_promoter_analytics_day_wise_date_promoter ON promoter_analytics_day_wise (date, promoter_id);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_promoter_analytics_day_wise_date_program ON promoter_analytics_day_wise (date, program_id);
        `);

        // Create functions
        await queryRunner.query(`
            -- Function to aggregate promoter analytics from day-wise data
            CREATE OR REPLACE FUNCTION aggregate_promoter_analytics_from_day_wise()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Delete existing aggregated data for this promoter-program combination
                DELETE FROM promoter_analytics 
                WHERE promoter_id = NEW.promoter_id AND program_id = NEW.program_id;

                -- Insert aggregated data from day-wise summary
                INSERT INTO promoter_analytics (promoter_id, program_id, total_revenue, total_commission, total_signups, total_purchases, created_at, updated_at)
                SELECT 
                    promoter_id,
                    program_id,
                    SUM(daily_revenue) as total_revenue,
                    SUM(daily_commission) as total_commission,
                    SUM(daily_signups) as total_signups,
                    SUM(daily_purchases) as total_purchases,
                    MIN(created_at) as created_at,
                    MAX(updated_at) as updated_at
                FROM promoter_analytics_day_wise
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
            BEGIN
                IF TG_OP = 'DELETE' THEN
                    -- Recalculate daily signups count for the day
                    UPDATE promoter_analytics_day_wise 
                    SET 
                        daily_signups = (
                            SELECT COUNT(s.contact_id)
                            FROM sign_up s
                            JOIN contact c ON s.contact_id = c.contact_id
                            WHERE c.program_id = promoter_analytics_day_wise.program_id 
                              AND s.promoter_id = promoter_analytics_day_wise.promoter_id
                              AND DATE(s.created_at) = promoter_analytics_day_wise.date
                        ),
                        updated_at = now()
                    WHERE promoter_id = OLD.promoter_id 
                      AND program_id = (SELECT program_id FROM contact WHERE contact_id = OLD.contact_id)
                      AND date = DATE(OLD.created_at);
                    
                    -- Update the aggregated table
                    PERFORM aggregate_promoter_analytics_from_day_wise();
                    RETURN OLD;
                ELSIF TG_OP = 'UPDATE' THEN
                    -- Handle promoter_id change
                    IF OLD.promoter_id != NEW.promoter_id THEN
                        -- Recalculate count for old promoter
                        UPDATE promoter_analytics_day_wise 
                        SET 
                            daily_signups = (
                                SELECT COUNT(s.contact_id)
                                FROM sign_up s
                                JOIN contact c ON s.contact_id = c.contact_id
                                WHERE c.program_id = promoter_analytics_day_wise.program_id 
                                  AND s.promoter_id = promoter_analytics_day_wise.promoter_id
                                  AND DATE(s.created_at) = promoter_analytics_day_wise.date
                            ),
                            updated_at = now()
                        WHERE promoter_id = OLD.promoter_id 
                          AND program_id = (SELECT program_id FROM contact WHERE contact_id = OLD.contact_id)
                          AND date = DATE(OLD.created_at);
                        
                        -- Insert or update for new promoter
                        INSERT INTO promoter_analytics_day_wise (
                            date, promoter_id, program_id, daily_revenue, daily_commission, daily_signups, daily_purchases
                        )
                        SELECT 
                            DATE(NEW.created_at),
                            NEW.promoter_id,
                            c.program_id,
                            0,
                            0,
                            (
                                SELECT COUNT(s.contact_id)
                                FROM sign_up s2
                                JOIN contact c2 ON s2.contact_id = c2.contact_id
                                WHERE c2.program_id = c.program_id 
                                  AND s2.promoter_id = NEW.promoter_id
                                  AND DATE(s2.created_at) = DATE(NEW.created_at)
                            ),
                            0
                        FROM contact c
                        WHERE c.contact_id = NEW.contact_id
                        ON CONFLICT (date, promoter_id, program_id) 
                        DO UPDATE SET 
                            daily_signups = (
                                SELECT COUNT(s.contact_id)
                                FROM sign_up s2
                                JOIN contact c2 ON s2.contact_id = c2.contact_id
                                WHERE c2.program_id = c.program_id 
                                  AND s2.promoter_id = NEW.promoter_id
                                  AND DATE(s2.created_at) = DATE(NEW.created_at)
                            ),
                            updated_at = now();
                    END IF;
                    
                    -- Update the aggregated table
                    PERFORM aggregate_promoter_analytics_from_day_wise();
                    RETURN NEW;
                ELSIF TG_OP = 'INSERT' THEN
                    -- Insert or update daily signups count
                    INSERT INTO promoter_analytics_day_wise (
                        date, promoter_id, program_id, daily_revenue, daily_commission, daily_signups, daily_purchases
                    )
                    SELECT 
                        DATE(NEW.created_at),
                        NEW.promoter_id,
                        c.program_id,
                        0,
                        0,
                        (
                            SELECT COUNT(s.contact_id)
                            FROM sign_up s2
                            JOIN contact c2 ON s2.contact_id = c2.contact_id
                            WHERE c2.program_id = c.program_id 
                              AND s2.promoter_id = NEW.promoter_id
                              AND DATE(s2.created_at) = DATE(NEW.created_at)
                        ),
                        0
                    FROM contact c
                    WHERE c.contact_id = NEW.contact_id
                    ON CONFLICT (date, promoter_id, program_id) 
                    DO UPDATE SET 
                        daily_signups = (
                            SELECT COUNT(s.contact_id)
                            FROM sign_up s2
                            JOIN contact c2 ON s2.contact_id = c2.contact_id
                            WHERE c2.program_id = c.program_id 
                              AND s2.promoter_id = NEW.promoter_id
                              AND DATE(s2.created_at) = DATE(NEW.created_at)
                        ),
                        updated_at = now();
                    
                    -- Update the aggregated table
                    PERFORM aggregate_promoter_analytics_from_day_wise();
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
                IF TG_OP = 'DELETE' THEN
                    -- Recalculate daily purchases count for the day
                    UPDATE promoter_analytics_day_wise 
                    SET 
                        daily_purchases = (
                            SELECT COUNT(p.purchase_id)
                            FROM purchase p
                            JOIN contact c ON p.contact_id = c.contact_id
                            WHERE c.program_id = promoter_analytics_day_wise.program_id 
                              AND p.promoter_id = promoter_analytics_day_wise.promoter_id
                              AND DATE(p.created_at) = promoter_analytics_day_wise.date
                        ),
                        updated_at = now()
                    WHERE promoter_id = OLD.promoter_id 
                      AND program_id = (SELECT program_id FROM contact WHERE contact_id = OLD.contact_id)
                      AND date = DATE(OLD.created_at);
                    
                    -- Update the aggregated table
                    PERFORM aggregate_promoter_analytics_from_day_wise();
                    RETURN OLD;
                ELSIF TG_OP = 'UPDATE' THEN
                    -- Handle promoter_id change
                    IF OLD.promoter_id != NEW.promoter_id THEN
                        -- Recalculate count for old promoter
                        UPDATE promoter_analytics_day_wise 
                        SET 
                            daily_purchases = (
                                SELECT COUNT(p.purchase_id)
                                FROM purchase p
                                JOIN contact c ON p.contact_id = c.contact_id
                                WHERE c.program_id = promoter_analytics_day_wise.program_id 
                                  AND p.promoter_id = promoter_analytics_day_wise.promoter_id
                                  AND DATE(p.created_at) = promoter_analytics_day_wise.date
                            ),
                            updated_at = now()
                        WHERE promoter_id = OLD.promoter_id 
                          AND program_id = (SELECT program_id FROM contact WHERE contact_id = OLD.contact_id)
                          AND date = DATE(OLD.created_at);
                        
                        -- Insert or update for new promoter
                        INSERT INTO promoter_analytics_day_wise (
                            date, promoter_id, program_id, daily_revenue, daily_commission, daily_signups, daily_purchases
                        )
                        SELECT 
                            DATE(NEW.created_at),
                            NEW.promoter_id,
                            c.program_id,
                            0,
                            0,
                            0,
                            (
                                SELECT COUNT(p.purchase_id)
                                FROM purchase p2
                                JOIN contact c2 ON p2.contact_id = c2.contact_id
                                WHERE c2.program_id = c.program_id 
                                  AND p2.promoter_id = NEW.promoter_id
                                  AND DATE(p2.created_at) = DATE(NEW.created_at)
                            )
                        FROM contact c
                        WHERE c.contact_id = NEW.contact_id
                        ON CONFLICT (date, promoter_id, program_id) 
                        DO UPDATE SET 
                            daily_purchases = (
                                SELECT COUNT(p.purchase_id)
                                FROM purchase p2
                                JOIN contact c2 ON p2.contact_id = c2.contact_id
                                WHERE c2.program_id = c.program_id 
                                  AND p2.promoter_id = NEW.promoter_id
                                  AND DATE(p2.created_at) = DATE(NEW.created_at)
                            ),
                            updated_at = now();
                    END IF;
                    
                    -- Update the aggregated table
                    PERFORM aggregate_promoter_analytics_from_day_wise();
                    RETURN NEW;
                ELSIF TG_OP = 'INSERT' THEN
                    -- Insert or update daily purchases count
                    INSERT INTO promoter_analytics_day_wise (
                        date, promoter_id, program_id, daily_revenue, daily_commission, daily_signups, daily_purchases
                    )
                    SELECT 
                        DATE(NEW.created_at),
                        NEW.promoter_id,
                        c.program_id,
                        0,
                        0,
                        0,
                        (
                            SELECT COUNT(p.purchase_id)
                            FROM purchase p2
                            JOIN contact c2 ON p2.contact_id = c2.contact_id
                            WHERE c2.program_id = c.program_id 
                              AND p2.promoter_id = NEW.promoter_id
                              AND DATE(p2.created_at) = DATE(NEW.created_at)
                        )
                    FROM contact c
                    WHERE c.contact_id = NEW.contact_id
                    ON CONFLICT (date, promoter_id, program_id) 
                    DO UPDATE SET 
                        daily_purchases = (
                            SELECT COUNT(p.purchase_id)
                            FROM purchase p2
                            JOIN contact c2 ON p2.contact_id = c2.contact_id
                            WHERE c2.program_id = c.program_id 
                              AND p2.promoter_id = NEW.promoter_id
                              AND DATE(p2.created_at) = DATE(NEW.created_at)
                        ),
                        updated_at = now();
                    
                    -- Update the aggregated table
                    PERFORM aggregate_promoter_analytics_from_day_wise();
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
            BEGIN
                IF TG_OP = 'DELETE' THEN
                    -- Recalculate daily commission amount for the day
                    UPDATE promoter_analytics_day_wise 
                    SET 
                        daily_commission = (
                            SELECT COALESCE(SUM(c.amount), 0)
                            FROM commission c
                            JOIN link l ON c.link_id = l.link_id
                            WHERE l.program_id = promoter_analytics_day_wise.program_id 
                              AND l.promoter_id = promoter_analytics_day_wise.promoter_id
                              AND DATE(c.created_at) = promoter_analytics_day_wise.date
                        ),
                        updated_at = now()
                    WHERE promoter_id = OLD.promoter_id 
                      AND program_id = (SELECT l.program_id FROM link l WHERE l.link_id = OLD.link_id)
                      AND date = DATE(OLD.created_at);
                    
                    -- Update the aggregated table
                    PERFORM aggregate_promoter_analytics_from_day_wise();
                    RETURN OLD;
                ELSIF TG_OP = 'UPDATE' THEN
                    -- Handle link_id or amount change
                    IF OLD.link_id != NEW.link_id OR OLD.amount != NEW.amount THEN
                        -- Recalculate amount for old link
                        UPDATE promoter_analytics_day_wise 
                        SET 
                            daily_commission = (
                                SELECT COALESCE(SUM(c.amount), 0)
                                FROM commission c
                                JOIN link l ON c.link_id = l.link_id
                                WHERE l.program_id = promoter_analytics_day_wise.program_id 
                                  AND l.promoter_id = promoter_analytics_day_wise.promoter_id
                                  AND DATE(c.created_at) = promoter_analytics_day_wise.date
                            ),
                            updated_at = now()
                        WHERE promoter_id = OLD.promoter_id 
                          AND program_id = (SELECT l.program_id FROM link l WHERE l.link_id = OLD.link_id)
                          AND date = DATE(OLD.created_at);
                        
                        -- Insert or update for new link
                        INSERT INTO promoter_analytics_day_wise (
                            date, promoter_id, program_id, daily_revenue, daily_commission, daily_signups, daily_purchases
                        )
                        SELECT 
                            DATE(NEW.created_at),
                            l.promoter_id,
                            l.program_id,
                            0,
                            (
                                SELECT COALESCE(SUM(c.amount), 0)
                                FROM commission c2
                                JOIN link l2 ON c2.link_id = l2.link_id
                                WHERE l2.program_id = l.program_id 
                                  AND l2.promoter_id = l.promoter_id
                                  AND DATE(c2.created_at) = DATE(NEW.created_at)
                            ),
                            0,
                            0
                        FROM link l
                        WHERE l.link_id = NEW.link_id
                        ON CONFLICT (date, promoter_id, program_id) 
                        DO UPDATE SET 
                            daily_commission = (
                                SELECT COALESCE(SUM(c.amount), 0)
                                FROM commission c2
                                JOIN link l2 ON c2.link_id = l2.link_id
                                WHERE l2.program_id = l.program_id 
                                  AND l2.promoter_id = l.promoter_id
                                  AND DATE(c2.created_at) = DATE(NEW.created_at)
                            ),
                            updated_at = now();
                    END IF;
                    
                    -- Update the aggregated table
                    PERFORM aggregate_promoter_analytics_from_day_wise();
                    RETURN NEW;
                ELSIF TG_OP = 'INSERT' THEN
                    -- Insert or update daily commission amount
                    INSERT INTO promoter_analytics_day_wise (
                        date, promoter_id, program_id, daily_revenue, daily_commission, daily_signups, daily_purchases
                    )
                    SELECT 
                        DATE(NEW.created_at),
                        l.promoter_id,
                        l.program_id,
                        0,
                        (
                            SELECT COALESCE(SUM(c.amount), 0)
                            FROM commission c2
                            JOIN link l2 ON c2.link_id = l2.link_id
                            WHERE l2.program_id = l.program_id 
                              AND l2.promoter_id = l.promoter_id
                              AND DATE(c2.created_at) = DATE(NEW.created_at)
                        ),
                        0,
                        0
                    FROM link l
                    WHERE l.link_id = NEW.link_id
                    ON CONFLICT (date, promoter_id, program_id) 
                    DO UPDATE SET 
                        daily_commission = (
                            SELECT COALESCE(SUM(c.amount), 0)
                            FROM commission c2
                            JOIN link l2 ON c2.link_id = l2.link_id
                            WHERE l2.program_id = l.program_id 
                              AND l2.promoter_id = l.promoter_id
                              AND DATE(c2.created_at) = DATE(NEW.created_at)
                        ),
                        updated_at = now();
                    
                    -- Update the aggregated table
                    PERFORM aggregate_promoter_analytics_from_day_wise();
                    RETURN NEW;
                END IF;
                
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            -- Function to update promoter analytics day-wise when referral is created/updated/deleted
            CREATE OR REPLACE FUNCTION update_promoter_analytics_from_referral()
            RETURNS TRIGGER AS $$
            BEGIN
                IF TG_OP = 'DELETE' THEN
                    -- Recalculate daily revenue and commission for the day
                    UPDATE promoter_analytics_day_wise 
                    SET 
                        daily_revenue = (
                            SELECT COALESCE(SUM(r.total_revenue), 0)
                            FROM referral r
                            WHERE r.program_id = promoter_analytics_day_wise.program_id 
                              AND r.promoter_id = promoter_analytics_day_wise.promoter_id
                              AND DATE(r.created_at) = promoter_analytics_day_wise.date
                        ),
                        daily_commission = (
                            SELECT COALESCE(SUM(r.total_commission), 0)
                            FROM referral r
                            WHERE r.program_id = promoter_analytics_day_wise.program_id 
                              AND r.promoter_id = promoter_analytics_day_wise.promoter_id
                              AND DATE(r.created_at) = promoter_analytics_day_wise.date
                        ),
                        updated_at = now()
                    WHERE promoter_id = OLD.promoter_id 
                      AND program_id = OLD.program_id
                      AND date = DATE(OLD.created_at);
                    
                    -- Update the aggregated table
                    PERFORM aggregate_promoter_analytics_from_day_wise();
                    RETURN OLD;
                ELSIF TG_OP = 'UPDATE' THEN
                    -- Handle program_id or promoter_id change
                    IF OLD.program_id != NEW.program_id OR OLD.promoter_id != NEW.promoter_id THEN
                        -- Recalculate for old combination
                        UPDATE promoter_analytics_day_wise 
                        SET 
                            daily_revenue = (
                                SELECT COALESCE(SUM(r.total_revenue), 0)
                                FROM referral r
                                WHERE r.program_id = promoter_analytics_day_wise.program_id 
                                  AND r.promoter_id = promoter_analytics_day_wise.promoter_id
                                  AND DATE(r.created_at) = promoter_analytics_day_wise.date
                            ),
                            daily_commission = (
                                SELECT COALESCE(SUM(r.total_commission), 0)
                                FROM referral r
                                WHERE r.program_id = promoter_analytics_day_wise.program_id 
                                  AND r.promoter_id = promoter_analytics_day_wise.promoter_id
                                  AND DATE(r.created_at) = promoter_analytics_day_wise.date
                            ),
                            updated_at = now()
                        WHERE promoter_id = OLD.promoter_id 
                          AND program_id = OLD.program_id
                          AND date = DATE(OLD.created_at);
                        
                        -- Insert or update for new combination
                        INSERT INTO promoter_analytics_day_wise (
                            date, promoter_id, program_id, daily_revenue, daily_commission, daily_signups, daily_purchases
                        )
                        SELECT 
                            DATE(NEW.created_at),
                            NEW.promoter_id,
                            NEW.program_id,
                            (
                                SELECT COALESCE(SUM(r.total_revenue), 0)
                                FROM referral r
                                WHERE r.program_id = NEW.program_id 
                                  AND r.promoter_id = NEW.promoter_id
                                  AND DATE(r.created_at) = DATE(NEW.created_at)
                            ),
                            (
                                SELECT COALESCE(SUM(r.total_commission), 0)
                                FROM referral r
                                WHERE r.program_id = NEW.program_id 
                                  AND r.promoter_id = NEW.promoter_id
                                  AND DATE(r.created_at) = DATE(NEW.created_at)
                            ),
                            0,
                            0
                        ON CONFLICT (date, promoter_id, program_id) 
                        DO UPDATE SET 
                            daily_revenue = (
                                SELECT COALESCE(SUM(r.total_revenue), 0)
                                FROM referral r
                                WHERE r.program_id = NEW.program_id 
                                  AND r.promoter_id = NEW.promoter_id
                                  AND DATE(r.created_at) = DATE(NEW.created_at)
                            ),
                            daily_commission = (
                                SELECT COALESCE(SUM(r.total_commission), 0)
                                FROM referral r
                                WHERE r.program_id = NEW.program_id 
                                  AND r.promoter_id = NEW.promoter_id
                                  AND DATE(r.created_at) = DATE(NEW.created_at)
                            ),
                            updated_at = now();
                    END IF;
                    
                    -- Update the aggregated table
                    PERFORM aggregate_promoter_analytics_from_day_wise();
                    RETURN NEW;
                ELSIF TG_OP = 'INSERT' THEN
                    -- Insert or update daily revenue and commission
                    INSERT INTO promoter_analytics_day_wise (
                        date, promoter_id, program_id, daily_revenue, daily_commission, daily_signups, daily_purchases
                    )
                    SELECT 
                        DATE(NEW.created_at),
                        NEW.promoter_id,
                        NEW.program_id,
                        (
                            SELECT COALESCE(SUM(r.total_revenue), 0)
                            FROM referral r
                            WHERE r.program_id = NEW.program_id 
                              AND r.promoter_id = NEW.promoter_id
                              AND DATE(r.created_at) = DATE(NEW.created_at)
                        ),
                        (
                            SELECT COALESCE(SUM(r.total_commission), 0)
                            FROM referral r
                            WHERE r.program_id = NEW.program_id 
                              AND r.promoter_id = NEW.promoter_id
                              AND DATE(r.created_at) = DATE(NEW.created_at)
                        ),
                        0,
                        0
                    ON CONFLICT (date, promoter_id, program_id) 
                    DO UPDATE SET 
                        daily_revenue = (
                            SELECT COALESCE(SUM(r.total_revenue), 0)
                            FROM referral r
                            WHERE r.program_id = NEW.program_id 
                              AND r.promoter_id = NEW.promoter_id
                              AND DATE(r.created_at) = DATE(NEW.created_at)
                        ),
                        daily_commission = (
                            SELECT COALESCE(SUM(r.total_commission), 0)
                            FROM referral r
                            WHERE r.program_id = NEW.program_id 
                              AND r.promoter_id = NEW.promoter_id
                              AND DATE(r.created_at) = DATE(NEW.created_at)
                        ),
                        updated_at = now();
                    
                    -- Update the aggregated table
                    PERFORM aggregate_promoter_analytics_from_day_wise();
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
                AFTER INSERT OR UPDATE OR DELETE ON promoter_analytics_day_wise
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

        await queryRunner.query(`
            -- Create triggers for referral table
            CREATE TRIGGER trigger_update_promoter_analytics_from_referral
                AFTER INSERT OR UPDATE OR DELETE ON referral
                FOR EACH ROW
                EXECUTE FUNCTION update_promoter_analytics_from_referral();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop triggers first
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_promoter_analytics_from_referral ON referral;
        `);

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
            DROP TRIGGER IF EXISTS trigger_aggregate_promoter_analytics ON promoter_analytics_day_wise;
        `);

        // Drop functions
        await queryRunner.query(`
            DROP FUNCTION IF EXISTS update_promoter_analytics_from_referral();
        `);

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
            DROP TABLE IF EXISTS promoter_analytics_day_wise;
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS promoter_analytics;
        `);
    }

}
