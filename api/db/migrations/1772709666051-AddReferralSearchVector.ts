import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReferralSearchVector1772000000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`
    ALTER TABLE referral_mv
    ADD COLUMN normalized_contact_info varchar NULL;
`);

        await queryRunner.query(`
    ALTER TABLE referral_mv
    ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('simple', coalesce(normalized_contact_info, ''))
    ) STORED;
`);

        await queryRunner.query(`
    CREATE INDEX referral_search_vector_idx
    ON referral_mv
    USING GIN (search_vector);
`);


        await queryRunner.query(`
            ALTER TABLE promoter
            ADD COLUMN normalized_name varchar NULL;
        `);

        await queryRunner.query(`
            ALTER TABLE promoter
            ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
                to_tsvector('simple', coalesce(normalized_name, ''))
            ) STORED;
        `);

        await queryRunner.query(`
            CREATE INDEX promoter_search_vector_idx
            ON promoter
            USING GIN (search_vector);
        `);

        await queryRunner.query(`
            ALTER TABLE member
            ADD COLUMN normalized_email varchar NULL;
        `);

        await queryRunner.query(`
            ALTER TABLE member
            ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
                to_tsvector('simple', coalesce(normalized_email, ''))
            ) STORED;
        `);

        await queryRunner.query(`
            CREATE INDEX member_search_vector_idx
            ON member
            USING GIN (search_vector);
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {


        await queryRunner.query(`DROP INDEX referral_search_vector_idx`);
        await queryRunner.query(`ALTER TABLE referral_mv DROP COLUMN search_vector`);
        await queryRunner.query(`ALTER TABLE referral_mv DROP COLUMN normalized_contact_info`);


        await queryRunner.query(`DROP INDEX promoter_search_vector_idx`);
        await queryRunner.query(`ALTER TABLE promoter DROP COLUMN search_vector`);
        await queryRunner.query(`ALTER TABLE promoter DROP COLUMN normalized_name`);


        await queryRunner.query(`DROP INDEX member_search_vector_idx`);
        await queryRunner.query(`ALTER TABLE member DROP COLUMN search_vector`);
        await queryRunner.query(`ALTER TABLE member DROP COLUMN normalized_email`);
    }
}