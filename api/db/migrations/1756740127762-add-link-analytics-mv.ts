import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLinkAnalyticMv1756740127762 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create link analytics tables
        await queryRunner.query(`
            -- Overall link analytics table
            CREATE TABLE link_analytics (
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
            CREATE TABLE link_analytics_day_wise (
                date DATE NOT NULL,
                link_id UUID NOT NULL,
                name VARCHAR NOT NULL,
                ref_val VARCHAR NOT NULL,
                program_id UUID NOT NULL,
                promoter_id UUID NOT NULL,
                daily_signups NUMERIC DEFAULT 0,
                daily_purchases NUMERIC DEFAULT 0,
                daily_commission NUMERIC DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                PRIMARY KEY (date, link_id)
            );
        `);

        // Create indexes for performance
        await queryRunner.query(`
            CREATE INDEX idx_link_analytics_program_id ON link_analytics (program_id);
            CREATE INDEX idx_link_analytics_promoter_id ON link_analytics (promoter_id);
            CREATE INDEX idx_link_analytics_ref_val ON link_analytics (ref_val);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_link_analytics_day_wise_date ON link_analytics_day_wise (date);
            CREATE INDEX idx_link_analytics_day_wise_link ON link_analytics_day_wise (link_id);
            CREATE INDEX idx_link_analytics_day_wise_program ON link_analytics_day_wise (program_id);
            CREATE INDEX idx_link_analytics_day_wise_promoter ON link_analytics_day_wise (promoter_id);
            CREATE INDEX idx_link_analytics_day_wise_date_program ON link_analytics_day_wise (date, program_id);
        `);

        // Create functions
        await queryRunner.query(`
            -- Function to aggregate link analytics from day-wise data
            CREATE OR REPLACE FUNCTION aggregate_link_analytics_from_day_wise()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Delete existing aggregated data for this link
                DELETE FROM link_analytics 
                WHERE link_id = NEW.link_id;

                -- Insert aggregated data from day-wise summary
                INSERT INTO link_analytics (link_id, name, ref_val, program_id, promoter_id, signups, purchases, commission, created_at, updated_at)
                SELECT 
                    link_id,
                    name,
                    ref_val,
                    program_id,
                    promoter_id,
                    SUM(daily_signups) as signups,
                    SUM(daily_purchases) as purchases,
                    SUM(daily_commission) as commission,
                    MIN(created_at) as created_at,
                    MAX(updated_at) as updated_at
                FROM link_analytics_day_wise
                WHERE link_id = NEW.link_id
                GROUP BY link_id, name, ref_val, program_id, promoter_id;

                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            -- Function to update link analytics day-wise when signup is created/updated/deleted
            CREATE OR REPLACE FUNCTION update_link_analytics_from_signup()
            RETURNS TRIGGER AS $$
            BEGIN
                IF TG_OP = 'DELETE' THEN
                    -- Recalculate daily signups count for the day
                    UPDATE link_analytics_day_wise 
                    SET 
                        daily_signups = (
                            SELECT COUNT(s.contact_id)
                            FROM sign_up s
                            WHERE s.link_id = OLD.link_id 
                              AND DATE(s.created_at) = DATE(OLD.created_at)
                        ),
                        updated_at = now()
                    WHERE link_id = OLD.link_id 
                      AND date = DATE(OLD.created_at);
                    
                    -- Update the aggregated table
                    PERFORM aggregate_link_analytics_from_day_wise();
                    RETURN OLD;
                ELSIF TG_OP = 'UPDATE' THEN
                    -- Handle link_id change
                    IF OLD.link_id != NEW.link_id THEN
                        -- Recalculate count for old link
                        UPDATE link_analytics_day_wise 
                        SET 
                            daily_signups = (
                                SELECT COUNT(s.contact_id)
                                FROM sign_up s
                                WHERE s.link_id = OLD.link_id 
                                  AND DATE(s.created_at) = DATE(OLD.created_at)
                            ),
                            updated_at = now()
                        WHERE link_id = OLD.link_id 
                          AND date = DATE(OLD.created_at);
                        
                        -- Insert or update for new link
                        INSERT INTO link_analytics_day_wise (
                            date, link_id, name, ref_val, program_id, promoter_id, 
                            daily_signups, daily_purchases, daily_commission
                        )
                        SELECT 
                            DATE(NEW.created_at),
                            l.link_id,
                            l.name,
                            l.ref_val,
                            l.program_id,
                            l.promoter_id,
                            (
                                SELECT COUNT(s.contact_id)
                                FROM sign_up s
                                WHERE s.link_id = NEW.link_id 
                                  AND DATE(s.created_at) = DATE(NEW.created_at)
                            ),
                            0,
                            0
                        FROM link l
                        WHERE l.link_id = NEW.link_id
                        ON CONFLICT (date, link_id) 
                        DO UPDATE SET 
                            daily_signups = (
                                SELECT COUNT(s.contact_id)
                                FROM sign_up s
                                WHERE s.link_id = NEW.link_id 
                                  AND DATE(s.created_at) = DATE(NEW.created_at)
                            ),
                            updated_at = now();
                    END IF;
                    
                    -- Update the aggregated table
                    PERFORM aggregate_link_analytics_from_day_wise();
                    RETURN NEW;
                ELSIF TG_OP = 'INSERT' THEN
                    -- Insert or update daily signups count
                    INSERT INTO link_analytics_day_wise (
                        date, link_id, name, ref_val, program_id, promoter_id, 
                        daily_signups, daily_purchases, daily_commission
                    )
                    SELECT 
                        DATE(NEW.created_at),
                        l.link_id,
                        l.name,
                        l.ref_val,
                        l.program_id,
                        l.promoter_id,
                        (
                            SELECT COUNT(s.contact_id)
                            FROM sign_up s
                            WHERE s.link_id = NEW.link_id 
                              AND DATE(s.created_at) = DATE(NEW.created_at)
                        ),
                        0,
                        0
                    FROM link l
                    WHERE l.link_id = NEW.link_id
                    ON CONFLICT (date, link_id) 
                    DO UPDATE SET 
                        daily_signups = (
                            SELECT COUNT(s.contact_id)
                            FROM sign_up s
                            WHERE s.link_id = NEW.link_id 
                              AND DATE(s.created_at) = DATE(NEW.created_at)
                        ),
                        updated_at = now();
                    
                    -- Update the aggregated table
                    PERFORM aggregate_link_analytics_from_day_wise();
                    RETURN NEW;
                END IF;
                
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            -- Function to update link analytics day-wise when purchase is created/updated/deleted
            CREATE OR REPLACE FUNCTION update_link_analytics_from_purchase()
            RETURNS TRIGGER AS $$
            BEGIN
                IF TG_OP = 'DELETE' THEN
                    -- Recalculate daily purchases count for the day
                    UPDATE link_analytics_day_wise 
                    SET 
                        daily_purchases = (
                            SELECT COUNT(p.purchase_id)
                            FROM purchase p
                            WHERE p.link_id = OLD.link_id 
                              AND DATE(p.created_at) = DATE(OLD.created_at)
                        ),
                        updated_at = now()
                    WHERE link_id = OLD.link_id 
                      AND date = DATE(OLD.created_at);
                    
                    -- Update the aggregated table
                    PERFORM aggregate_link_analytics_from_day_wise();
                    RETURN OLD;
                ELSIF TG_OP = 'UPDATE' THEN
                    -- Handle link_id change
                    IF OLD.link_id != NEW.link_id THEN
                        -- Recalculate count for old link
                        UPDATE link_analytics_day_wise 
                        SET 
                            daily_purchases = (
                                SELECT COUNT(p.purchase_id)
                                FROM purchase p
                                WHERE p.link_id = OLD.link_id 
                                  AND DATE(p.created_at) = DATE(OLD.created_at)
                            ),
                            updated_at = now()
                        WHERE link_id = OLD.link_id 
                          AND date = DATE(OLD.created_at);
                        
                        -- Insert or update for new link
                        INSERT INTO link_analytics_day_wise (
                            date, link_id, name, ref_val, program_id, promoter_id, 
                            daily_signups, daily_purchases, daily_commission
                        )
                        SELECT 
                            DATE(NEW.created_at),
                            l.link_id,
                            l.name,
                            l.ref_val,
                            l.program_id,
                            l.promoter_id,
                            0,
                            (
                                SELECT COUNT(p.purchase_id)
                                FROM purchase p
                                WHERE p.link_id = NEW.link_id 
                                  AND DATE(p.created_at) = DATE(NEW.created_at)
                            ),
                            0
                        FROM link l
                        WHERE l.link_id = NEW.link_id
                        ON CONFLICT (date, link_id) 
                        DO UPDATE SET 
                            daily_purchases = (
                                SELECT COUNT(p.purchase_id)
                                FROM purchase p
                                WHERE p.link_id = NEW.link_id 
                                  AND DATE(p.created_at) = DATE(NEW.created_at)
                            ),
                            updated_at = now();
                    END IF;
                    
                    -- Update the aggregated table
                    PERFORM aggregate_link_analytics_from_day_wise();
                    RETURN NEW;
                ELSIF TG_OP = 'INSERT' THEN
                    -- Insert or update daily purchases count
                    INSERT INTO link_analytics_day_wise (
                        date, link_id, name, ref_val, program_id, promoter_id, 
                        daily_signups, daily_purchases, daily_commission
                    )
                    SELECT 
                        DATE(NEW.created_at),
                        l.link_id,
                        l.name,
                        l.ref_val,
                        l.program_id,
                        l.promoter_id,
                        0,
                        (
                            SELECT COUNT(p.purchase_id)
                            FROM purchase p
                            WHERE p.link_id = NEW.link_id 
                              AND DATE(p.created_at) = DATE(NEW.created_at)
                        ),
                        0
                    FROM link l
                    WHERE l.link_id = NEW.link_id
                    ON CONFLICT (date, link_id) 
                    DO UPDATE SET 
                        daily_purchases = (
                            SELECT COUNT(p.purchase_id)
                            FROM purchase p
                            WHERE p.link_id = NEW.link_id 
                              AND DATE(p.created_at) = DATE(NEW.created_at)
                        ),
                        updated_at = now();
                    
                    -- Update the aggregated table
                    PERFORM aggregate_link_analytics_from_day_wise();
                    RETURN NEW;
                END IF;
                
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            -- Function to update link analytics day-wise when commission is created/updated/deleted
            CREATE OR REPLACE FUNCTION update_link_analytics_from_commission()
            RETURNS TRIGGER AS $$
            BEGIN
                IF TG_OP = 'DELETE' THEN
                    -- Recalculate daily commission amount for the day
                    UPDATE link_analytics_day_wise 
                    SET 
                        daily_commission = (
                            SELECT COALESCE(SUM(c.amount), 0)
                            FROM commission c
                            WHERE c.link_id = OLD.link_id 
                              AND DATE(c.created_at) = DATE(OLD.created_at)
                        ),
                        updated_at = now()
                    WHERE link_id = OLD.link_id 
                      AND date = DATE(OLD.created_at);
                    
                    -- Update the aggregated table
                    PERFORM aggregate_link_analytics_from_day_wise();
                    RETURN OLD;
                ELSIF TG_OP = 'UPDATE' THEN
                    -- Handle link_id or amount change
                    IF OLD.link_id != NEW.link_id OR OLD.amount != NEW.amount THEN
                        -- Recalculate amount for old link
                        UPDATE link_analytics_day_wise 
                        SET 
                            daily_commission = (
                                SELECT COALESCE(SUM(c.amount), 0)
                                FROM commission c
                                WHERE c.link_id = OLD.link_id 
                                  AND DATE(c.created_at) = DATE(OLD.created_at)
                            ),
                            updated_at = now()
                        WHERE link_id = OLD.link_id 
                          AND date = DATE(OLD.created_at);
                        
                        -- Insert or update for new link
                        INSERT INTO link_analytics_day_wise (
                            date, link_id, name, ref_val, program_id, promoter_id, 
                            daily_signups, daily_purchases, daily_commission
                        )
                        SELECT 
                            DATE(NEW.created_at),
                            l.link_id,
                            l.name,
                            l.ref_val,
                            l.program_id,
                            l.promoter_id,
                            0,
                            0,
                            (
                                SELECT COALESCE(SUM(c.amount), 0)
                                FROM commission c
                                WHERE c.link_id = NEW.link_id 
                                  AND DATE(c.created_at) = DATE(NEW.created_at)
                            )
                        FROM link l
                        WHERE l.link_id = NEW.link_id
                        ON CONFLICT (date, link_id) 
                        DO UPDATE SET 
                            daily_commission = (
                                SELECT COALESCE(SUM(c.amount), 0)
                                FROM commission c
                                WHERE c.link_id = NEW.link_id 
                                  AND DATE(c.created_at) = DATE(NEW.created_at)
                            ),
                            updated_at = now();
                    END IF;
                    
                    -- Update the aggregated table
                    PERFORM aggregate_link_analytics_from_day_wise();
                    RETURN NEW;
                ELSIF TG_OP = 'INSERT' THEN
                    -- Insert or update daily commission amount
                    INSERT INTO link_analytics_day_wise (
                        date, link_id, name, ref_val, program_id, promoter_id, 
                        daily_signups, daily_purchases, daily_commission
                    )
                    SELECT 
                        DATE(NEW.created_at),
                        l.link_id,
                        l.name,
                        l.ref_val,
                        l.program_id,
                        l.promoter_id,
                        0,
                        0,
                        (
                            SELECT COALESCE(SUM(c.amount), 0)
                            FROM commission c
                            WHERE c.link_id = NEW.link_id 
                              AND DATE(c.created_at) = DATE(NEW.created_at)
                        )
                    FROM link l
                    WHERE l.link_id = NEW.link_id
                    ON CONFLICT (date, link_id) 
                    DO UPDATE SET 
                        daily_commission = (
                            SELECT COALESCE(SUM(c.amount), 0)
                            FROM commission c
                            WHERE c.link_id = NEW.link_id 
                              AND DATE(c.created_at) = DATE(NEW.created_at)
                        ),
                        updated_at = now();
                    
                    -- Update the aggregated table
                    PERFORM aggregate_link_analytics_from_day_wise();
                    RETURN NEW;
                END IF;
                
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            -- Function to initialize link analytics from existing data
            CREATE OR REPLACE FUNCTION initialize_link_analytics()
            RETURNS void AS $$
            BEGIN
                -- Clear existing data
                DELETE FROM link_analytics_day_wise;
                DELETE FROM link_analytics;
                
                -- Initialize from signups
                INSERT INTO link_analytics_day_wise (
                    date, link_id, name, ref_val, program_id, promoter_id, 
                    daily_signups, daily_purchases, daily_commission
                )
                SELECT 
                    DATE(s.created_at),
                    l.link_id,
                    l.name,
                    l.ref_val,
                    l.program_id,
                    l.promoter_id,
                    COUNT(s.contact_id),
                    0,
                    0
                FROM sign_up s
                JOIN link l ON s.link_id = l.link_id
                WHERE l.status = 'ACTIVE'
                GROUP BY DATE(s.created_at), l.link_id, l.name, l.ref_val, l.program_id, l.promoter_id;
                
                -- Add purchases data
                INSERT INTO link_analytics_day_wise (
                    date, link_id, name, ref_val, program_id, promoter_id, 
                    daily_signups, daily_purchases, daily_commission
                )
                SELECT 
                    DATE(p.created_at),
                    l.link_id,
                    l.name,
                    l.ref_val,
                    l.program_id,
                    l.promoter_id,
                    0,
                    COUNT(p.purchase_id),
                    0
                FROM purchase p
                JOIN link l ON p.link_id = l.link_id
                WHERE l.status = 'ACTIVE'
                GROUP BY DATE(p.created_at), l.link_id, l.name, l.ref_val, l.program_id, l.promoter_id
                ON CONFLICT (date, link_id) 
                DO UPDATE SET 
                    daily_purchases = EXCLUDED.daily_purchases,
                    updated_at = now();
                
                -- Add commission data
                INSERT INTO link_analytics_day_wise (
                    date, link_id, name, ref_val, program_id, promoter_id, 
                    daily_signups, daily_purchases, daily_commission
                )
                SELECT 
                    DATE(c.created_at),
                    l.link_id,
                    l.name,
                    l.ref_val,
                    l.program_id,
                    l.promoter_id,
                    0,
                    0,
                    SUM(c.amount)
                FROM commission c
                JOIN link l ON c.link_id = l.link_id
                WHERE l.status = 'ACTIVE'
                GROUP BY DATE(c.created_at), l.link_id, l.name, l.ref_val, l.program_id, l.promoter_id
                ON CONFLICT (date, link_id) 
                DO UPDATE SET 
                    daily_commission = EXCLUDED.daily_commission,
                    updated_at = now();
                
                -- Trigger aggregation to populate the main table
                PERFORM aggregate_link_analytics_from_day_wise();
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Create triggers
        await queryRunner.query(`
            -- Create trigger to automatically update aggregated data
            CREATE TRIGGER trigger_aggregate_link_analytics
                AFTER INSERT OR UPDATE OR DELETE ON link_analytics_day_wise
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

        // Initialize analytics with existing data
        await queryRunner.query(`SELECT initialize_link_analytics();`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop triggers first
        await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_update_link_analytics_from_commission ON commission;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_update_link_analytics_from_purchase ON purchase;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_update_link_analytics_from_signup ON sign_up;`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_aggregate_link_analytics ON link_analytics_day_wise;`);

        // Drop functions
        await queryRunner.query(`DROP FUNCTION IF EXISTS initialize_link_analytics();`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_link_analytics_from_commission();`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_link_analytics_from_purchase();`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_link_analytics_from_signup();`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS aggregate_link_analytics_from_day_wise();`);

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS link_analytics_day_wise;`);
        await queryRunner.query(`DROP TABLE IF EXISTS link_analytics;`);
    }

}
