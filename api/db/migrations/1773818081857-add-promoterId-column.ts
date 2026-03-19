import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPromoterIdColumn1773818081857 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "api_key" ADD "promoter_id" uuid`);
        await queryRunner.query(`ALTER TABLE "api_key" ADD CONSTRAINT "FK_api_key_promoter_id" FOREIGN KEY ("promoter_id") REFERENCES "promoter"("promoter_id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "api_key" DROP CONSTRAINT "FK_api_key_promoter_id"`);
        await queryRunner.query(`ALTER TABLE "api_key" DROP COLUMN "promoter_id"`);
    }

}
