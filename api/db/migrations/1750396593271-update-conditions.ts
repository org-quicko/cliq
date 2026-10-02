import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateConditions1750396593271 implements MigrationInterface {
    name = 'UpdateConditions1750396593271'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = process.env.DB_SCHEMA || 'public';
        if (schema !== 'public') {
            await queryRunner.query(`SET search_path TO "${schema}", public`);
        }
        await queryRunner.query(`ALTER TYPE "${schema}"."condition_parameter_enum" RENAME TO "condition_parameter_enum_old"`);
        await queryRunner.query(`CREATE TYPE "${schema}"."condition_parameter_enum" AS ENUM('revenue', 'no. of signups', 'no. of purchases', 'item_id')`);
        await queryRunner.query(`ALTER TABLE "condition" ALTER COLUMN "parameter" TYPE "${schema}"."condition_parameter_enum" USING "parameter"::"text"::"${schema}"."condition_parameter_enum"`);
        await queryRunner.query(`DROP TYPE "${schema}"."condition_parameter_enum_old"`);
        await queryRunner.query(`ALTER TYPE "${schema}"."condition_operator_enum" RENAME TO "condition_operator_enum_old"`);
        await queryRunner.query(`CREATE TYPE "${schema}"."condition_operator_enum" AS ENUM('greater_than_or_equal_to', 'less_than_or_equal_to', 'greater_than', 'less_than', 'equals', 'contains')`);
        await queryRunner.query(`ALTER TABLE "condition" ALTER COLUMN "operator" TYPE "${schema}"."condition_operator_enum" USING "operator"::"text"::"${schema}"."condition_operator_enum"`);
        await queryRunner.query(`DROP TYPE "${schema}"."condition_operator_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = process.env.DB_SCHEMA || 'public';
        if (schema !== 'public') {
            await queryRunner.query(`SET search_path TO "${schema}", public`);
        }
        await queryRunner.query(`CREATE TYPE "${schema}"."condition_operator_enum_old" AS ENUM('less_than_or_equal_to', 'less_than', 'equals', 'contains')`);
        await queryRunner.query(`ALTER TABLE "condition" ALTER COLUMN "operator" TYPE "${schema}"."condition_operator_enum_old" USING "operator"::"text"::"${schema}"."condition_operator_enum_old"`);
        await queryRunner.query(`DROP TYPE "${schema}"."condition_operator_enum"`);
        await queryRunner.query(`ALTER TYPE "${schema}"."condition_operator_enum_old" RENAME TO "condition_operator_enum"`);
        await queryRunner.query(`CREATE TYPE "${schema}"."condition_parameter_enum_old" AS ENUM('no. of signups', 'no. of purchases', 'item_id')`);
        await queryRunner.query(`ALTER TABLE "condition" ALTER COLUMN "parameter" TYPE "${schema}"."condition_parameter_enum_old" USING "parameter"::"text"::"${schema}"."condition_parameter_enum_old"`);
        await queryRunner.query(`DROP TYPE "${schema}"."condition_parameter_enum"`);
        await queryRunner.query(`ALTER TYPE "${schema}"."condition_parameter_enum_old" RENAME TO "condition_parameter_enum"`);
    }

}
