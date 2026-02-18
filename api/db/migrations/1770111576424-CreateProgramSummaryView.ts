import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProgramSummaryView1770111576424 implements MigrationInterface {
    name = 'CreateProgramSummaryView1770111576424'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "typeorm_metadata" (
            "type" character varying NOT NULL,
            "database" character varying,
            "schema" character varying,
            "table" character varying,
            "name" character varying,
            "value" text
        )`);

        await queryRunner.query(`CREATE MATERIALIZED VIEW "program_summary_mv" AS 
		SELECT 
			p.program_id,
			p.name AS program_name,
			COALESCE(r.total_promoters, 0) AS total_promoters,
			COALESCE(r.total_referrals, 0) AS total_referrals,
			p.created_at
		FROM program p
		LEFT JOIN (
			SELECT 
				program_id,
				COUNT(promoter_id) AS total_promoters,
				COUNT(contact_id) AS total_referrals
			FROM referral_mv
			GROUP BY program_id
		) r ON p.program_id = r.program_id;
	`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","MATERIALIZED_VIEW","program_summary_mv","SELECT \n\t\t\tp.program_id,\n\t\t\tp.name AS program_name,\n\t\t\tCOALESCE(r.total_promoters, 0) AS total_promoters,\n\t\t\tCOALESCE(r.total_referrals, 0) AS total_referrals,\n\t\t\tp.created_at\n\t\tFROM program p\n\t\tLEFT JOIN (\n\t\t\tSELECT \n\t\t\t\tprogram_id,\n\t\t\t\tCOUNT(promoter_id) AS total_promoters,\n\t\t\t\tCOUNT(contact_id) AS total_referrals\n\t\t\tFROM referral_mv\n\t\t\tGROUP BY program_id\n\t\t) r ON p.program_id = r.program_id;"]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["MATERIALIZED_VIEW","program_summary_mv","public"]);
        await queryRunner.query(`DROP MATERIALIZED VIEW "program_summary_mv"`);
    }

}
