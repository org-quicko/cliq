import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveMaterializedViews1756737141436 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP MATERIALIZED VIEW "promoter_analytics_mv"`);
        await queryRunner.query(`DROP MATERIALIZED VIEW "link_analytics_mv"`);
        await queryRunner.query(`DROP MATERIALIZED VIEW "referral_mv"`);
        await queryRunner.query(`DROP TABLE typeorm_metadata`);        
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE MATERIALIZED VIEW "referral_mv"`);
        await queryRunner.query(`CREATE MATERIALIZED VIEW "link_analytics_mv"`);
        await queryRunner.query(`CREATE MATERIALIZED VIEW "promoter_analytics_mv"`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "typeorm_metadata" (
            "type" character varying NOT NULL,
            "database" character varying,
            "schema" character varying,
            "table" character varying,
            "name" character varying,
            "value" text
        )`);
    }

}
