import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExternalIdAndRenameColumns1774876800000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`ALTER TABLE "sign_up" ADD "external_id" character varying`);

        await queryRunner.query(`ALTER TABLE "purchase" ADD "external_id" character varying`);

        await queryRunner.query(`ALTER TABLE "commission" RENAME COLUMN "external_id" TO "reference_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`ALTER TABLE "commission" RENAME COLUMN "reference_id" TO "external_id"`);

        await queryRunner.query(`ALTER TABLE "purchase" DROP COLUMN "external_id"`);

        await queryRunner.query(`ALTER TABLE "sign_up" DROP COLUMN "external_id"`);
    }

}
