import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommissionTypeColumns1756834338065 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		// Add new columns to promoter_analytics_mv
		await queryRunner.query(`
            ALTER TABLE promoter_analytics_mv 
            ADD COLUMN signup_commission NUMERIC,
            ADD COLUMN purchase_commission NUMERIC;
        `);

		// Add new columns to promoter_analytics_day_wise_mv
		await queryRunner.query(`
            ALTER TABLE promoter_analytics_day_wise_mv 
            ADD COLUMN signup_commission NUMERIC,
            ADD COLUMN purchase_commission NUMERIC;
        `);

		// Create function to update promoter analytics from commission changes
		await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_promoter_analytics_from_commission()
            RETURNS TRIGGER AS $$
            DECLARE
                v_program_id UUID;
                v_date DATE;
                v_promoter_id UUID;
                v_commission_signups NUMERIC;
                v_commission_purchases NUMERIC;
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

                -- Get program_id and calculate commissions by type
                SELECT 
                    c.program_id,
                    p.created_at as promoter_created_at,
                    p.updated_at as promoter_updated_at,
                    (SELECT COALESCE(SUM(com.amount), 0) 
                     FROM commission com 
                     WHERE com.promoter_id = v_promoter_id
                       AND com.created_at >= date_start 
                       AND com.created_at < date_end
                       AND com.conversion_type = 'signup') as commission_signups,
                    (SELECT COALESCE(SUM(com.amount), 0) 
                     FROM commission com 
                     WHERE com.promoter_id = v_promoter_id
                       AND com.created_at >= date_start 
                       AND com.created_at < date_end
                       AND com.conversion_type = 'purchase') as commission_purchases
                INTO v_program_id, v_created_at, v_updated_at, v_commission_signups, v_commission_purchases
                FROM contact c
                JOIN promoter p ON p.promoter_id = v_promoter_id
                WHERE c.contact_id = COALESCE(NEW.contact_id, OLD.contact_id);

                -- Early exit if no program_id found
                IF v_program_id IS NULL THEN
                    RETURN COALESCE(NEW, OLD);
                END IF;

                -- First try to update existing record
                UPDATE promoter_analytics_day_wise_mv 
                SET 
                    commission = (SELECT COALESCE(SUM(com.amount), 0) 
                                  FROM commission com 
                                  WHERE com.promoter_id = v_promoter_id
                                    AND com.created_at >= date_start 
                                    AND com.created_at < date_end),
                    signup_commission = v_commission_signups,
                    purchase_commission = v_commission_purchases,
                    updated_at = now()
                WHERE date = v_date 
                    AND promoter_id = v_promoter_id 
                    AND program_id = v_program_id;
                
                -- If no rows were updated, insert new record
                IF NOT FOUND THEN
                    INSERT INTO promoter_analytics_day_wise_mv (
                        date, promoter_id, program_id,
                        revenue, commission, signup_commission, purchase_commission,
                        signups, purchases,
                        created_at, updated_at
                    )
                    VALUES (
                        v_date,
                        v_promoter_id,
                        v_program_id,
                        0,
                        (SELECT COALESCE(SUM(com.amount), 0) 
                         FROM commission com 
                         WHERE com.promoter_id = v_promoter_id
                           AND com.created_at >= date_start 
                           AND com.created_at < date_end),
                        NULLIF(v_commission_signups, 0),
                        NULLIF(v_commission_purchases, 0),
                        0,
                        0,
                        v_created_at,
                        v_updated_at
                    );
                END IF;
                
                RETURN COALESCE(NEW, OLD);
            END;
            $$ LANGUAGE plpgsql;
        `);

		// Create trigger for commission table
		await queryRunner.query(`
            CREATE TRIGGER trg_commission_to_promoter_analytics
            AFTER INSERT OR UPDATE OR DELETE ON commission
            FOR EACH ROW
            EXECUTE FUNCTION update_promoter_analytics_from_commission();
        `);

		// Update the aggregate function to handle new columns
		await queryRunner.query(`
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
                INSERT INTO promoter_analytics_mv (
                    promoter_id, program_id, 
                    total_revenue, total_commission,
                    signup_commission, purchase_commission,
                    total_signups, total_purchases, 
                    created_at, updated_at
                )
                VALUES (
                    NEW.promoter_id,
                    NEW.program_id,
                    (SELECT COALESCE(SUM(revenue), 0) 
                     FROM promoter_analytics_day_wise_mv 
                     WHERE promoter_id = NEW.promoter_id AND program_id = NEW.program_id),
                    (SELECT COALESCE(SUM(commission), 0) 
                     FROM promoter_analytics_day_wise_mv 
                     WHERE promoter_id = NEW.promoter_id AND program_id = NEW.program_id),
                    (SELECT COALESCE(SUM(signup_commission), 0) 
                     FROM promoter_analytics_day_wise_mv 
                     WHERE promoter_id = NEW.promoter_id AND program_id = NEW.program_id),
                    (SELECT COALESCE(SUM(purchase_commission), 0) 
                     FROM promoter_analytics_day_wise_mv 
                     WHERE promoter_id = NEW.promoter_id AND program_id = NEW.program_id),
                    (SELECT COALESCE(SUM(signups), 0) 
                     FROM promoter_analytics_day_wise_mv 
                     WHERE promoter_id = NEW.promoter_id AND program_id = NEW.program_id),
                    (SELECT COALESCE(SUM(purchases), 0) 
                     FROM promoter_analytics_day_wise_mv 
                     WHERE promoter_id = NEW.promoter_id AND program_id = NEW.program_id),
                    NEW.created_at,
                    NEW.updated_at
                )
                ON CONFLICT (promoter_id, program_id)
                DO UPDATE SET
                    total_revenue = EXCLUDED.total_revenue,
                    total_commission = EXCLUDED.total_commission,
                    signup_commission = EXCLUDED.signup_commission,
                    purchase_commission = EXCLUDED.purchase_commission,
                    total_signups = EXCLUDED.total_signups,
                    total_purchases = EXCLUDED.total_purchases,
                    updated_at = EXCLUDED.updated_at;

                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Drop trigger
		await queryRunner.query(`
            DROP TRIGGER IF EXISTS trg_commission_to_promoter_analytics ON commission;
        `);

		// Drop function
		await queryRunner.query(`
            DROP FUNCTION IF EXISTS update_promoter_analytics_from_commission();
        `);

		// Restore original aggregate function (without commission breakdown)
		await queryRunner.query(`
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

		// Remove columns from promoter_analytics_day_wise_mv
		await queryRunner.query(`
            ALTER TABLE promoter_analytics_day_wise_mv 
            DROP COLUMN signup_commission,
            DROP COLUMN purchase_commission;
        `);

		// Remove columns from promoter_analytics_mv
		await queryRunner.query(`
            ALTER TABLE promoter_analytics_mv 
            DROP COLUMN signup_commission,
            DROP COLUMN purchase_commission;
        `);
	}
}
