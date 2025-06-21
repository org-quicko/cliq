import { MigrationInterface, QueryRunner } from "typeorm";

export class Test1750423143586 implements MigrationInterface {
    name = 'Test1750423143586'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase" DROP CONSTRAINT "FK_a4ea159c479503d4b64fb223f58"`);
        await queryRunner.query(`ALTER TABLE "purchase" ALTER COLUMN "link_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "purchase" ADD CONSTRAINT "FK_a4ea159c479503d4b64fb223f58" FOREIGN KEY ("link_id") REFERENCES "link"("link_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase" DROP CONSTRAINT "FK_a4ea159c479503d4b64fb223f58"`);
        await queryRunner.query(`ALTER TABLE "purchase" ALTER COLUMN "link_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "purchase" ADD CONSTRAINT "FK_a4ea159c479503d4b64fb223f58" FOREIGN KEY ("link_id") REFERENCES "link"("link_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
