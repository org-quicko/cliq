import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexes1757073287472 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            -- Link table indexes
            CREATE INDEX IF NOT EXISTS idx_link_program_id_promoter_id ON link (program_id, promoter_id) 
			WHERE program_id IS NOT NULL AND promoter_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_link_program_id ON link (program_id);
            CREATE INDEX IF NOT EXISTS idx_link_promoter_id ON link (promoter_id);

			-- Contact table indexes
			CREATE INDEX IF NOT EXISTS idx_contact_program_id_status ON contact (program_id, status) 
			WHERE program_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_contact_program_id_created_at ON contact (program_id, created_at)
            WHERE program_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_contact_status_created_at ON contact (status, created_at)
            WHERE status IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_contact_created_at_program_id ON contact (created_at, program_id);
            CREATE INDEX IF NOT EXISTS idx_contact_program_id ON contact (program_id);
            CREATE INDEX IF NOT EXISTS idx_contact_program_id_contact_id ON contact (program_id, contact_id)
            WHERE program_id IS NOT NULL AND contact_id IS NOT NULL;


			-- Purchase table indexes
			CREATE INDEX IF NOT EXISTS idx_purchase_link_id_contact_id_created_at ON purchase (link_id, contact_id, created_at) 
			WHERE link_id IS NOT NULL AND contact_id IS NOT NULL;
			CREATE INDEX IF NOT EXISTS idx_purchase_link_id_created_at ON purchase (link_id, created_at)
            WHERE link_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_purchase_promoter_id_created_at ON purchase (promoter_id, created_at) 
            WHERE promoter_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_purchase_contact_id_created_at ON purchase (contact_id, created_at)
            WHERE contact_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_purchase_created_at ON purchase (created_at);

			-- Commission table indexes
			CREATE INDEX IF NOT EXISTS idx_commission_link_id_contact_id_created_at ON commission (link_id, contact_id, created_at) 
			WHERE link_id IS NOT NULL AND contact_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_commission_promoter_id_created_at ON commission (promoter_id, created_at)
            WHERE promoter_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_commission_link_id_created_at ON commission (link_id, created_at) 
            WHERE link_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_commission_contact_id_created_at ON commission (contact_id, created_at)
            WHERE contact_id IS NOT NULL;
            -- Keep only the most efficient date-based index
            CREATE INDEX IF NOT EXISTS idx_commission_created_at_link_id ON commission (created_at, link_id);
            CREATE INDEX IF NOT EXISTS idx_commission_created_at ON commission (created_at);
            CREATE INDEX IF NOT EXISTS idx_commission_conversion_type_external_id 
            ON commission (conversion_type, external_id) 
            WHERE conversion_type IS NOT NULL AND external_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_commission_signup_promoter_external_id 
            ON commission (conversion_type, promoter_id, external_id) 
            WHERE conversion_type = 'signup' AND promoter_id IS NOT NULL AND external_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_commission_purchase_promoter_external_id 
            ON commission (conversion_type, promoter_id, external_id) 
            WHERE conversion_type = 'purchase' AND promoter_id IS NOT NULL AND external_id IS NOT NULL;
             CREATE INDEX IF NOT EXISTS idx_commission_signup_promoter_created_at 
            ON commission (conversion_type, promoter_id, created_at) 
            WHERE conversion_type = 'signup' AND promoter_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_commission_purchase_promoter_created_at 
            ON commission (conversion_type, promoter_id, created_at) 
            WHERE conversion_type = 'purchase' AND promoter_id IS NOT NULL;

            -- Signup table indexes
            CREATE INDEX IF NOT EXISTS idx_signup_created_at ON sign_up (created_at);
            CREATE INDEX IF NOT EXISTS idx_signup_promoter_id_created_at ON sign_up (promoter_id, created_at) 
            WHERE promoter_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_signup_link_id_created_at ON sign_up (link_id, created_at)
            WHERE link_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_signup_link_id_contact_id_created_at ON sign_up (link_id, contact_id, created_at)
            WHERE link_id IS NOT NULL AND contact_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_signup_contact_id_created_at ON sign_up (contact_id, created_at)
            WHERE contact_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_signup_contact_id_created_at_promoter_id 
            ON sign_up (contact_id, created_at, promoter_id) 
            WHERE contact_id IS NOT NULL AND promoter_id IS NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            -- Drop all indexes in reverse order
            DROP INDEX IF EXISTS idx_link_program_id_promoter_id;
            DROP INDEX IF EXISTS idx_link_program_id;
            DROP INDEX IF EXISTS idx_link_promoter_id;
            
            DROP INDEX IF EXISTS idx_contact_program_id_status;
            DROP INDEX IF EXISTS idx_contact_program_id_created_at;
            DROP INDEX IF EXISTS idx_contact_status_created_at;
            DROP INDEX IF EXISTS idx_contact_created_at_program_id;
            DROP INDEX IF EXISTS idx_contact_program_id;
            DROP INDEX IF EXISTS idx_contact_program_id_contact_id;

            DROP INDEX IF EXISTS idx_purchase_link_id_contact_id_created_at;
            DROP INDEX IF EXISTS idx_purchase_link_id_created_at;
            DROP INDEX IF EXISTS idx_purchase_promoter_id_created_at;
            DROP INDEX IF EXISTS idx_purchase_created_at_link_id;
            DROP INDEX IF EXISTS idx_purchase_created_at_promoter_id;
            DROP INDEX IF EXISTS idx_purchase_created_at;
            
            
            DROP INDEX IF EXISTS idx_commission_link_id_contact_id_created_at;
            DROP INDEX IF EXISTS idx_commission_promoter_id_created_at;
            DROP INDEX IF EXISTS idx_commission_link_id_created_at;
            DROP INDEX IF EXISTS idx_commission_contact_id_created_at;
            DROP INDEX IF EXISTS idx_commission_created_at_link_id;
            DROP INDEX IF EXISTS idx_commission_created_at;
            DROP INDEX IF EXISTS idx_commission_conversion_type_external_id;
            DROP INDEX IF EXISTS idx_commission_signup_promoter_external_id;
            DROP INDEX IF EXISTS idx_commission_purchase_promoter_external_id;
            DROP INDEX IF EXISTS idx_commission_signup_promoter_created_at;
            DROP INDEX IF EXISTS idx_commission_purchase_promoter_created_at;


            DROP INDEX IF EXISTS idx_signup_created_at;
            DROP INDEX IF EXISTS idx_signup_promoter_id_created_at;
            DROP INDEX IF EXISTS idx_signup_link_id_created_at;
            DROP INDEX IF EXISTS idx_signup_link_id_contact_id_created_at;
            DROP INDEX IF EXISTS idx_signup_contact_id_created_at;
            DROP INDEX IF EXISTS idx_signup_contact_id_created_at_promoter_id;
        `);
    }

}
