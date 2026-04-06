import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePromoterWebhookEntity1774875240037 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "promoter_webhook" (
                "webhook_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "url" character varying NOT NULL,
                "program_id" uuid NOT NULL,
                "promoter_id" uuid NOT NULL,
                "secret" character varying NOT NULL,
                "events" character varying[] NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_df7e8a9ab1cdc512f5a305a929c" PRIMARY KEY ("webhook_id")
            );
        `);

        await queryRunner.query(`
            ALTER TABLE "promoter_webhook"
            ADD CONSTRAINT "FK_33bd729362a86d6604a5a2baf86"
            FOREIGN KEY ("program_id")
            REFERENCES "program"("program_id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION;
        `);

        await queryRunner.query(`
            ALTER TABLE "promoter_webhook"
            ADD CONSTRAINT "FK_cf08dd047197062ffa6b2bdab11"
            FOREIGN KEY ("promoter_id")
            REFERENCES "promoter"("promoter_id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "promoter_webhook"
            DROP CONSTRAINT "FK_cf08dd047197062ffa6b2bdab11";
        `);

        await queryRunner.query(`
            ALTER TABLE "promoter_webhook"
            DROP CONSTRAINT "FK_33bd729362a86d6604a5a2baf86";
        `);

        await queryRunner.query(`
            DROP TABLE "promoter_webhook";
        `);
    }
}