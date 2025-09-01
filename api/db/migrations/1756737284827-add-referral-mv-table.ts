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

		await queryRunner.query(`
			CREATE TABLE "referral_day_wise_mv" (
				"date" DATE NOT NULL,
				"program_id" UUID NOT NULL,
				"promoter_id" UUID NOT NULL,
				"contact_id" UUID NOT NULL,
				"status" contact_status_enum NOT NULL,
				"contact_info" VARCHAR NOT NULL,
				"daily_revenue" NUMERIC DEFAULT 0,
				"daily_commission" NUMERIC DEFAULT 0,
				"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
				PRIMARY KEY ("date", "program_id", "promoter_id", "contact_id")
			);
		`);

		// Create indexes for performance
		await queryRunner.query(`
			CREATE INDEX "idx_referral_mv_program_id" ON "referral_mv" ("program_id");
			CREATE INDEX "idx_referral_mv_promoter_id" ON "referral_mv" ("promoter_id");
			CREATE INDEX "idx_referral_mv_contact_id" ON "referral_mv" ("contact_id");
			CREATE UNIQUE INDEX "idx_referral_mv_unique" ON "referral_mv" ("program_id", "promoter_id", "contact_id");
		`);

		await queryRunner.query(`
			CREATE INDEX "idx_referral_day_wise_date" ON "referral_day_wise_mv" ("date");
			CREATE INDEX "idx_referral_day_wise_program" ON "referral_day_wise_mv" ("program_id");
			CREATE INDEX "idx_referral_day_wise_promoter" ON "referral_day_wise_mv" ("promoter_id");
			CREATE INDEX "idx_referral_day_wise_contact" ON "referral_day_wise_mv" ("contact_id");
			CREATE INDEX "idx_referral_day_wise_date_program" ON "referral_day_wise_mv" ("date", "program_id");
			CREATE UNIQUE INDEX "idx_referral_day_wise_unique" ON "referral_day_wise_mv" ("date", "program_id", "promoter_id", "contact_id");
		`);

		// Create functions
		await queryRunner.query(`
			-- Function to update referral_day_wise_mv from signup operations
			CREATE OR REPLACE FUNCTION update_referral_day_wise_from_signup()
			RETURNS TRIGGER AS $$
			DECLARE
				link_program_id UUID;
				link_promoter_id UUID;
				contact_status contact_status_enum;
				contact_info VARCHAR;
				record_date DATE;
			BEGIN
				-- Query link table to get program_id and promoter_id based on link_id
				SELECT l.program_id, l.promoter_id
				INTO link_program_id, link_promoter_id
				FROM link l
				WHERE l.link_id = COALESCE(NEW.link_id, OLD.link_id);

				-- If no link found, return early
				IF link_program_id IS NULL OR link_promoter_id IS NULL THEN
					RETURN NULL;
				END IF;

				-- Get contact status and contact_info based on program's referral_key_type
				SELECT 
					c.status,
					CASE 
						WHEN p.referral_key_type = 'email' THEN c.email
						WHEN p.referral_key_type = 'phone' THEN c.phone
						ELSE c.email  -- default to email
					END
				INTO contact_status, contact_info
				FROM contact c
				JOIN program p ON c.program_id = p.program_id
				WHERE c.contact_id = COALESCE(NEW.contact_id, OLD.contact_id);

				-- Determine the date for the record
				IF TG_OP = 'INSERT' THEN
					record_date = COALESCE(NEW.created_at::date, CURRENT_DATE);
				ELSIF TG_OP = 'UPDATE' THEN
					record_date = COALESCE(NEW.created_at::date, CURRENT_DATE);
				ELSIF TG_OP = 'DELETE' THEN
					record_date = COALESCE(OLD.created_at::date, CURRENT_DATE);
				END IF;

				IF TG_OP = 'INSERT' THEN
					-- Insert or update daily record
					INSERT INTO referral_day_wise_mv (
						date, program_id, promoter_id, contact_id, status, contact_info, 
						daily_revenue, daily_commission
					) VALUES (
						record_date, link_program_id, link_promoter_id, NEW.contact_id, 
						contact_status, contact_info, 0, 0
					)
					ON CONFLICT (date, program_id, promoter_id, contact_id)
					DO UPDATE SET
						status = EXCLUDED.status,
						contact_info = EXCLUDED.contact_info,
						updated_at = now();

				ELSIF TG_OP = 'UPDATE' THEN
					UPDATE referral_day_wise_mv 
					SET 
						status = contact_status,
						contact_info = contact_info,
						updated_at = now()
					WHERE date = record_date 
						AND program_id = link_program_id 
						AND promoter_id = link_promoter_id 
						AND contact_id = NEW.contact_id;

				ELSIF TG_OP = 'DELETE' THEN
					UPDATE referral_day_wise_mv  
					SET 
						status = contact_status,
						contact_info = contact_info,
						updated_at = now()
					WHERE date = record_date 
						AND program_id = link_program_id 
						AND promoter_id = link_promoter_id 
						AND contact_id = OLD.contact_id;
				END IF;

				RETURN NULL;
			END;
			$$ LANGUAGE plpgsql;
		`);

		await queryRunner.query(`
			-- Function to update referral_day_wise_mv from purchase operations
			CREATE OR REPLACE FUNCTION update_referral_day_wise_from_purchase()
			RETURNS TRIGGER AS $$
			DECLARE
				link_program_id UUID;
				link_promoter_id UUID;
				contact_status contact_status_enum;
				contact_info VARCHAR;
				record_date DATE;
			BEGIN
				-- Query link table to get program_id and promoter_id based on link_id
				SELECT l.program_id, l.promoter_id
				INTO link_program_id, link_promoter_id
				FROM link l
				WHERE l.link_id = COALESCE(NEW.link_id, OLD.link_id);

				-- If no link found, return early
				IF link_program_id IS NULL OR link_promoter_id IS NULL THEN
					RETURN NULL;
				END IF;

				-- Get contact status and contact_info based on program's referral_key_type
				SELECT 
					c.status,
					CASE 
						WHEN p.referral_key_type = 'email' THEN c.email
						WHEN p.referral_key_type = 'phone' THEN c.phone
						ELSE c.email  -- default to email
					END
				INTO contact_status, contact_info
				FROM contact c
				JOIN program p ON c.program_id = p.program_id
				WHERE c.contact_id = COALESCE(NEW.contact_id, OLD.contact_id);

				-- Determine the date for the record
				IF TG_OP = 'INSERT' THEN
					record_date = COALESCE(NEW.created_at::date, CURRENT_DATE);
				ELSIF TG_OP = 'UPDATE' THEN
					record_date = COALESCE(NEW.created_at::date, CURRENT_DATE);
				ELSIF TG_OP = 'DELETE' THEN
					record_date = COALESCE(OLD.created_at::date, CURRENT_DATE);
				END IF;

				IF TG_OP = 'INSERT' THEN
					-- Insert or update daily record
					INSERT INTO referral_day_wise_mv (
						date, program_id, promoter_id, contact_id, status, contact_info, 
						daily_revenue, daily_commission
					) VALUES (
						record_date, link_program_id, link_promoter_id, NEW.contact_id, 
						contact_status, contact_info, NEW.amount, 0
					)
					ON CONFLICT (date, program_id, promoter_id, contact_id)
					DO UPDATE SET
						daily_revenue = (
							SELECT COALESCE(SUM(amount), 0)
							FROM purchase p
							JOIN link l ON p.link_id = l.link_id
							WHERE l.program_id = link_program_id
								AND l.promoter_id = link_promoter_id
								AND p.contact_id = NEW.contact_id
								AND p.created_at::date = record_date
						),
						daily_commission = referral_day_wise_mv.daily_commission,
						status = EXCLUDED.status,
						contact_info = EXCLUDED.contact_info,
						updated_at = now();

				ELSIF TG_OP = 'UPDATE' THEN
					-- Update daily record with new aggregated values
					INSERT INTO referral_day_wise_mv (
						date, program_id, promoter_id, contact_id, status, contact_info, 
						daily_revenue, daily_commission
					) VALUES (
						record_date, link_program_id, link_promoter_id, NEW.contact_id, 
						contact_status, contact_info, NEW.amount, 0
					)
					ON CONFLICT (date, program_id, promoter_id, contact_id)
					DO UPDATE SET
						daily_revenue = (
							SELECT COALESCE(SUM(amount), 0)
							FROM purchase p
							JOIN link l ON p.link_id = l.link_id
							WHERE l.program_id = link_program_id
								AND l.promoter_id = link_promoter_id
								AND p.contact_id = NEW.contact_id
								AND p.created_at::date = record_date
						),
						daily_commission = referral_day_wise_mv.daily_commission,
						status = EXCLUDED.status,
						contact_info = EXCLUDED.contact_info,
						updated_at = now();

				ELSIF TG_OP = 'DELETE' THEN
					-- Update daily record after deletion
					INSERT INTO referral_day_wise_mv (
						date, program_id, promoter_id, contact_id, status, contact_info, 
						daily_revenue, daily_commission
					) VALUES (
						record_date, link_program_id, link_promoter_id, OLD.contact_id, 
						contact_status, contact_info, 0, 0
					)
					ON CONFLICT (date, program_id, promoter_id, contact_id)
					DO UPDATE SET
						daily_revenue = (
							SELECT COALESCE(SUM(amount), 0)
							FROM purchase p
							JOIN link l ON p.link_id = l.link_id
							WHERE l.program_id = link_program_id
								AND l.promoter_id = link_promoter_id
								AND p.contact_id = OLD.contact_id
								AND p.created_at::date = record_date
						),
						daily_commission = referral_day_wise_mv.daily_commission,
						status = EXCLUDED.status,
						contact_info = EXCLUDED.contact_info,
						updated_at = now();
				END IF;

				RETURN NULL;
			END;
			$$ LANGUAGE plpgsql;
		`);

		await queryRunner.query(`
			-- Function to update referral_day_wise_mv from commission operations
			CREATE OR REPLACE FUNCTION update_referral_day_wise_from_commission()
			RETURNS TRIGGER AS $$
			DECLARE
				link_program_id UUID;
				link_promoter_id UUID;
				contact_status contact_status_enum;
				contact_info VARCHAR;
				record_date DATE;
			BEGIN
				-- Query link table to get program_id and promoter_id based on link_id
				SELECT l.program_id, l.promoter_id
				INTO link_program_id, link_promoter_id
				FROM link l
				WHERE l.link_id = COALESCE(NEW.link_id, OLD.link_id);

				-- If no link found, return early
				IF link_program_id IS NULL OR link_promoter_id IS NULL THEN
					RETURN NULL;
				END IF;

				-- Get contact status and contact_info based on program's referral_key_type
				SELECT 
					c.status,
					CASE 
						WHEN p.referral_key_type = 'email' THEN c.email
						WHEN p.referral_key_type = 'phone' THEN c.phone
						ELSE c.email  -- default to email
					END
				INTO contact_status, contact_info
				FROM contact c
				JOIN program p ON c.program_id = p.program_id
				WHERE c.contact_id = COALESCE(NEW.contact_id, OLD.contact_id);

				-- Determine the date for the record
				IF TG_OP = 'INSERT' THEN
					record_date = COALESCE(NEW.created_at::date, CURRENT_DATE);
				ELSIF TG_OP = 'UPDATE' THEN
					record_date = COALESCE(NEW.created_at::date, CURRENT_DATE);
				ELSIF TG_OP = 'DELETE' THEN
					record_date = COALESCE(OLD.created_at::date, CURRENT_DATE);
				END IF;

				IF TG_OP = 'INSERT' THEN
					-- Insert or update daily record
					INSERT INTO referral_day_wise_mv (
						date, program_id, promoter_id, contact_id, status, contact_info, 
						daily_revenue, daily_commission
					) VALUES (
						record_date, link_program_id, link_promoter_id, NEW.contact_id, 
						contact_status, contact_info, 0, NEW.amount
					)
					ON CONFLICT (date, program_id, promoter_id, contact_id)
					DO UPDATE SET
						daily_commission = (
							SELECT COALESCE(SUM(amount), 0)
							FROM commission c
							JOIN link l ON c.link_id = l.link_id
							WHERE l.program_id = link_program_id
								AND l.promoter_id = link_promoter_id
								AND c.contact_id = NEW.contact_id
								AND c.created_at::date = record_date
						),
						daily_revenue = referral_day_wise_mv.daily_revenue,
						status = EXCLUDED.status,
						contact_info = EXCLUDED.contact_info,
						updated_at = now();

				ELSIF TG_OP = 'UPDATE' THEN
					-- Update daily record with new aggregated values
					INSERT INTO referral_day_wise_mv (
						date, program_id, promoter_id, contact_id, status, contact_info, 
						daily_revenue, daily_commission
					) VALUES (
						record_date, link_program_id, link_promoter_id, NEW.contact_id, 
						contact_status, contact_info, 0, NEW.amount
					)
					ON CONFLICT (date, program_id, promoter_id, contact_id)
					DO UPDATE SET
						daily_commission = (
							SELECT COALESCE(SUM(amount), 0)
							FROM commission c
							JOIN link l ON c.link_id = l.link_id
							WHERE l.program_id = link_program_id
								AND l.promoter_id = link_promoter_id
								AND c.contact_id = NEW.contact_id
								AND c.created_at::date = record_date
						),
						status = EXCLUDED.status,
						contact_info = EXCLUDED.contact_info,
						updated_at = now();

				ELSIF TG_OP = 'DELETE' THEN
					-- Update daily record after deletion
					INSERT INTO referral_day_wise_mv (
						date, program_id, promoter_id, contact_id, status, contact_info, 
						daily_revenue, daily_commission
					) VALUES (
						record_date, link_program_id, link_promoter_id, OLD.contact_id, 
						contact_status, contact_info, 0, 0
					)
					ON CONFLICT (date, program_id, promoter_id, contact_id)
					DO UPDATE SET
						daily_commission = (
							SELECT COALESCE(SUM(amount), 0)
							FROM commission c
							JOIN link l ON c.link_id = l.link_id
							WHERE l.program_id = link_program_id
								AND l.promoter_id = link_promoter_id
								AND c.contact_id = OLD.contact_id
								AND c.created_at::date = record_date
						),
						status = EXCLUDED.status,
						contact_info = EXCLUDED.contact_info,
						updated_at = now();
				END IF;

				RETURN NULL;
			END;
			$$ LANGUAGE plpgsql;
		`);

		await queryRunner.query(`
			-- Function to aggregate referral from day-wise data
			CREATE OR REPLACE FUNCTION aggregate_referral_from_day_wise()
			RETURNS TRIGGER AS $$
			BEGIN
				-- Delete existing aggregated data for this combination
				DELETE FROM referral_mv 
				WHERE program_id = NEW.program_id 
					AND promoter_id = NEW.promoter_id 
					AND contact_id = NEW.contact_id;

				-- Insert aggregated data from day-wise summary
				INSERT INTO referral_mv (program_id, promoter_id, contact_id, status, contact_info, total_revenue, total_commission, created_at, updated_at)
				SELECT 
					program_id,
					promoter_id,
					contact_id,
					status,
					contact_info,
					SUM(daily_revenue) as total_revenue,
					SUM(daily_commission) as total_commission,
					MIN(created_at) as created_at,
					MAX(updated_at) as updated_at
				FROM referral_day_wise_mv
				WHERE program_id = NEW.program_id 
					AND promoter_id = NEW.promoter_id 
					AND contact_id = NEW.contact_id
				GROUP BY program_id, promoter_id, contact_id, status, contact_info;

				RETURN NULL;
			END;
			$$ LANGUAGE plpgsql;
		`);

		// Create triggers
		await queryRunner.query(`
			-- Create trigger for signup operations
			CREATE TRIGGER trg_signup_referral_mv 
				AFTER INSERT OR UPDATE OR DELETE ON contact 
				FOR EACH ROW 
				EXECUTE FUNCTION update_referral_day_wise_from_signup();
		`);

		await queryRunner.query(`
			-- Create trigger for purchase operations
			CREATE TRIGGER trg_purchase_referral_mv 
				AFTER INSERT OR UPDATE OR DELETE ON purchase 
				FOR EACH ROW 
				EXECUTE FUNCTION update_referral_day_wise_from_purchase();
		`);

		await queryRunner.query(`
			-- Create trigger for commission operations
			CREATE TRIGGER trg_commission_referral_mv 
				AFTER INSERT OR UPDATE OR DELETE ON commission 
				FOR EACH ROW 
				EXECUTE FUNCTION update_referral_day_wise_from_commission();
		`);

		await queryRunner.query(`
			-- Create trigger to automatically update aggregated data
			CREATE TRIGGER trg_aggregate_referral_mv 
				AFTER INSERT OR UPDATE OR DELETE ON referral_day_wise_mv 
				FOR EACH ROW 
				EXECUTE FUNCTION aggregate_referral_from_day_wise();
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Drop triggers first
		await queryRunner.query(`DROP TRIGGER IF EXISTS trg_aggregate_referral_mv ON referral_day_wise_mv;`);
		await queryRunner.query(`DROP TRIGGER IF EXISTS trg_commission_referral_mv ON commission;`);
		await queryRunner.query(`DROP TRIGGER IF EXISTS trg_purchase_referral_mv ON purchase;`);
		await queryRunner.query(`DROP TRIGGER IF EXISTS trg_signup_referral_mv ON contact;`);

		// Drop functions
		await queryRunner.query(`DROP FUNCTION IF EXISTS aggregate_referral_from_day_wise();`);
		await queryRunner.query(`DROP FUNCTION IF EXISTS update_referral_day_wise_from_commission();`);
		await queryRunner.query(`DROP FUNCTION IF EXISTS update_referral_day_wise_from_purchase();`);
		await queryRunner.query(`DROP FUNCTION IF EXISTS update_referral_day_wise_from_signup();`);

		// Drop tables
		await queryRunner.query(`DROP TABLE IF EXISTS referral_day_wise_mv;`);
		await queryRunner.query(`DROP TABLE IF EXISTS referral_mv;`);
	}
}
