import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReferralMvTable1756737284827 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		// Create referral materialized view tables
		await queryRunner.query(`
			CREATE TABLE "referral_mv" (
				"program_id" uuid NOT NULL,
				"promoter_id" uuid NOT NULL,
				"contact_id" uuid NOT NULL,
				"status" contact_status_enum NOT NULL,
				"contact_info" VARCHAR NOT NULL,
				"total_revenue" NUMERIC DEFAULT 0,
				"total_commission" NUMERIC DEFAULT 0,
				"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				PRIMARY KEY ("program_id", "promoter_id", "contact_id")
			);
		`);

		// Create indexes for performance
		await queryRunner.query(`
			-- Referral MV indexes
			CREATE INDEX IF NOT EXISTS "idx_referral_mv_program_id" ON "referral_mv" ("program_id");
			CREATE INDEX IF NOT EXISTS "idx_referral_mv_promoter_id" ON "referral_mv" ("promoter_id");
			CREATE INDEX IF NOT EXISTS "idx_referral_mv_contact_id" ON "referral_mv" ("contact_id");
			
			CREATE INDEX IF NOT EXISTS "idx_referral_mv_program_promoter" ON "referral_mv" ("program_id", "promoter_id");
			CREATE INDEX IF NOT EXISTS "idx_referral_mv_promoter_contact" ON "referral_mv" ("promoter_id", "contact_id");
			CREATE INDEX IF NOT EXISTS "idx_referral_mv_status" ON "referral_mv" ("status");
		`);

		// Removed day-wise indexes as the table is no longer needed

		// Create simplified functions that update referral_mv directly
		await queryRunner.query(`
			-- Function to update referral_mv from signup operations
			CREATE OR REPLACE FUNCTION update_referral_mv_from_signup()
			RETURNS TRIGGER AS $$
			DECLARE
				link_program_id UUID;
				link_promoter_id UUID;
				contact_status contact_status_enum;
				contact_info_val VARCHAR;
				contact_created_at TIMESTAMPTZ;
				contact_updated_at TIMESTAMPTZ;
				v_contact_id UUID;
			BEGIN
				v_contact_id := COALESCE(NEW.contact_id, OLD.contact_id);
				
				-- Early exit if no contact_id
				IF v_contact_id IS NULL THEN
					RETURN COALESCE(NEW, OLD);
				END IF;

				-- Get link and contact data
				SELECT 
					l.program_id,
					l.promoter_id,
					c.status,
					CASE 
						WHEN p.referral_key_type = 'email' THEN c.email
						WHEN p.referral_key_type = 'phone' THEN c.phone
						ELSE c.email
					END as contact_info,
					c.created_at,
					c.updated_at
				INTO link_program_id, link_promoter_id, contact_status, contact_info_val, contact_created_at, contact_updated_at
				FROM link l
				JOIN contact c ON c.contact_id = v_contact_id
				JOIN program p ON c.program_id = p.program_id
				WHERE l.link_id = COALESCE(NEW.link_id, OLD.link_id);
				
				-- If no link found, return early
				IF link_program_id IS NULL OR link_promoter_id IS NULL THEN
					RETURN COALESCE(NEW, OLD);
				END IF;

				-- Insert or update referral_mv directly
				INSERT INTO referral_mv (
					program_id, promoter_id, contact_id, status, contact_info, 
					total_revenue, total_commission, created_at, updated_at
				) VALUES (
					link_program_id, link_promoter_id, v_contact_id, 
					contact_status, contact_info_val, 0, 0, contact_created_at, contact_updated_at
				)
				ON CONFLICT (program_id, promoter_id, contact_id)
				DO UPDATE SET
					status = EXCLUDED.status,
					contact_info = EXCLUDED.contact_info,
					updated_at = now();

				RETURN COALESCE(NEW, OLD);
			END;
			$$ LANGUAGE plpgsql;
		`);

		await queryRunner.query(`
			-- Function to update referral_mv from purchase operations
			CREATE OR REPLACE FUNCTION update_referral_mv_from_purchase()
			RETURNS TRIGGER AS $$
			DECLARE
				link_program_id UUID;
				link_promoter_id UUID;
				contact_status contact_status_enum;
				contact_info_val VARCHAR;
				total_revenue_calc NUMERIC;
				total_commission_calc NUMERIC;
				contact_created_at TIMESTAMPTZ;
				contact_updated_at TIMESTAMPTZ;
				v_contact_id UUID;
			BEGIN
				v_contact_id := COALESCE(NEW.contact_id, OLD.contact_id);
				
				-- Get link and contact data
				SELECT 
					l.program_id,
					l.promoter_id,
					c.status,
					CASE 
						WHEN p.referral_key_type = 'email' THEN c.email
						WHEN p.referral_key_type = 'phone' THEN c.phone
						ELSE c.email
					END as contact_info,
					c.created_at,
					c.updated_at
				INTO link_program_id, link_promoter_id, contact_status, contact_info_val, contact_created_at, contact_updated_at
				FROM link l
				JOIN contact c ON c.contact_id = v_contact_id
				JOIN program p ON c.program_id = p.program_id
				WHERE l.link_id = COALESCE(NEW.link_id, OLD.link_id);

				-- If no link found, return early
				IF link_program_id IS NULL OR link_promoter_id IS NULL THEN
					RETURN COALESCE(NEW, OLD);
				END IF;

				-- Calculate total revenue for this contact
				SELECT COALESCE(SUM(amount), 0)
				INTO total_revenue_calc
				FROM purchase p
				JOIN link l ON p.link_id = l.link_id
				WHERE l.program_id = link_program_id
					AND l.promoter_id = link_promoter_id
					AND p.contact_id = v_contact_id;

				-- Calculate total commission for this contact
				SELECT COALESCE(SUM(amount), 0)
				INTO total_commission_calc
				FROM commission c
				JOIN link l ON c.link_id = l.link_id
				WHERE l.program_id = link_program_id
					AND l.promoter_id = link_promoter_id
					AND c.contact_id = v_contact_id;

				-- Insert or update referral_mv directly
				INSERT INTO referral_mv (
					program_id, promoter_id, contact_id, status, contact_info, 
					total_revenue, total_commission, created_at, updated_at
				) VALUES (
					link_program_id, link_promoter_id, v_contact_id, 
					contact_status, contact_info_val, total_revenue_calc, total_commission_calc, contact_created_at, contact_updated_at
				)
				ON CONFLICT (program_id, promoter_id, contact_id)
				DO UPDATE SET
					total_revenue = EXCLUDED.total_revenue,
					total_commission = EXCLUDED.total_commission,
					status = EXCLUDED.status,
					contact_info = EXCLUDED.contact_info,
					updated_at = now();

				RETURN COALESCE(NEW, OLD);
			END;
			$$ LANGUAGE plpgsql;
		`);

		await queryRunner.query(`
			-- Function to update referral_mv from commission operations
			CREATE OR REPLACE FUNCTION update_referral_mv_from_commission()
			RETURNS TRIGGER AS $$
			DECLARE
				link_program_id UUID;
				link_promoter_id UUID;
				contact_status contact_status_enum;
				contact_info_val VARCHAR;
				total_revenue_calc NUMERIC;
				total_commission_calc NUMERIC;
				contact_created_at TIMESTAMPTZ;
				contact_updated_at TIMESTAMPTZ;
				v_contact_id UUID;
			BEGIN
				v_contact_id := COALESCE(NEW.contact_id, OLD.contact_id);
				
				-- Get link and contact data
				SELECT 
					l.program_id,
					l.promoter_id,
					c.status,
					CASE 
						WHEN p.referral_key_type = 'email' THEN c.email
						WHEN p.referral_key_type = 'phone' THEN c.phone
						ELSE c.email
					END as contact_info,
					c.created_at,
					c.updated_at
				INTO link_program_id, link_promoter_id, contact_status, contact_info_val, contact_created_at, contact_updated_at
				FROM link l
				JOIN contact c ON c.contact_id = v_contact_id
				JOIN program p ON c.program_id = p.program_id
				WHERE l.link_id = COALESCE(NEW.link_id, OLD.link_id);

				-- If no link found, return early
				IF link_program_id IS NULL OR link_promoter_id IS NULL THEN
					RETURN COALESCE(NEW, OLD);
				END IF;

				-- Calculate total revenue for this contact
				SELECT COALESCE(SUM(amount), 0)
				INTO total_revenue_calc
				FROM purchase p
				JOIN link l ON p.link_id = l.link_id
				WHERE l.program_id = link_program_id
					AND l.promoter_id = link_promoter_id
					AND p.contact_id = v_contact_id;

				-- Calculate total commission for this contact
				SELECT COALESCE(SUM(amount), 0)
				INTO total_commission_calc
				FROM commission c
				JOIN link l ON c.link_id = l.link_id
				WHERE l.program_id = link_program_id
					AND l.promoter_id = link_promoter_id
					AND c.contact_id = v_contact_id;

				-- Insert or update referral_mv directly
				INSERT INTO referral_mv (
					program_id, promoter_id, contact_id, status, contact_info, 
					total_revenue, total_commission, created_at, updated_at
				) VALUES (
					link_program_id, link_promoter_id, v_contact_id, 
					contact_status, contact_info_val, total_revenue_calc, total_commission_calc, contact_created_at, contact_updated_at
				)
				ON CONFLICT (program_id, promoter_id, contact_id)
				DO UPDATE SET
					total_revenue = EXCLUDED.total_revenue,
					total_commission = EXCLUDED.total_commission,
					status = EXCLUDED.status,
					contact_info = EXCLUDED.contact_info,
					updated_at = now();

				RETURN COALESCE(NEW, OLD);
			END;
			$$ LANGUAGE plpgsql;
		`);

		// Removed aggregation function as we no longer use day-wise data

		// Create triggers
		await queryRunner.query(`
			-- Create trigger for signup operations
			CREATE TRIGGER trg_signup_referral_mv 
				AFTER INSERT OR UPDATE OR DELETE ON sign_up 
				FOR EACH ROW 
				EXECUTE FUNCTION update_referral_mv_from_signup();
		`);

		await queryRunner.query(`
			-- Create trigger for purchase operations
			CREATE TRIGGER trg_purchase_referral_mv 
				AFTER INSERT OR UPDATE OR DELETE ON purchase 
				FOR EACH ROW 
				EXECUTE FUNCTION update_referral_mv_from_purchase();
		`);

		await queryRunner.query(`
			-- Create trigger for commission operations
			CREATE TRIGGER trg_commission_referral_mv 
				AFTER INSERT OR UPDATE OR DELETE ON commission 
				FOR EACH ROW 
				EXECUTE FUNCTION update_referral_mv_from_commission();
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Drop triggers first
		await queryRunner.query(
			`DROP TRIGGER IF EXISTS trg_commission_referral_mv ON commission;`,
		);
		await queryRunner.query(
			`DROP TRIGGER IF EXISTS trg_purchase_referral_mv ON purchase;`,
		);
		await queryRunner.query(
			`DROP TRIGGER IF EXISTS trg_signup_referral_mv ON sign_up;`,
		);

		// Drop functions
		await queryRunner.query(
			`DROP FUNCTION IF EXISTS update_referral_mv_from_commission();`,
		);
		await queryRunner.query(
			`DROP FUNCTION IF EXISTS update_referral_mv_from_purchase();`,
		);
		await queryRunner.query(
			`DROP FUNCTION IF EXISTS update_referral_mv_from_signup();`,
		);

		// Drop indexes for referral_mv
		await queryRunner.query(`DROP INDEX IF EXISTS "idx_referral_mv_program_id";`);
		await queryRunner.query(`DROP INDEX IF EXISTS "idx_referral_mv_promoter_id";`);
		await queryRunner.query(`DROP INDEX IF EXISTS "idx_referral_mv_contact_id";`);
		await queryRunner.query(`DROP INDEX IF EXISTS "idx_referral_mv_program_promoter";`);
		await queryRunner.query(`DROP INDEX IF EXISTS "idx_referral_mv_promoter_contact";`);
		await queryRunner.query(`DROP INDEX IF EXISTS "idx_referral_mv_status";`);

		// Drop table
		await queryRunner.query(`DROP TABLE IF EXISTS referral_mv;`);
	}
}
