import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1747141132471 implements MigrationInterface {
    name = 'Migrations1747141132471'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."commission_conversion_type_enum" AS ENUM('signup', 'purchase')`);
        await queryRunner.query(`CREATE TABLE "commission" ("commission_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversion_type" "public"."commission_conversion_type_enum" NOT NULL, "external_id" uuid NOT NULL, "amount" numeric NOT NULL, "revenue" numeric, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "contact_id" uuid NOT NULL, "promoter_id" uuid NOT NULL, "link_id" uuid NOT NULL, CONSTRAINT "PK_2459aaa9caa0ee8ef88cd60911d" PRIMARY KEY ("commission_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."contact_status_enum" AS ENUM('active', 'lead')`);
        await queryRunner.query(`CREATE TABLE "contact" ("contact_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying, "first_name" character varying, "external_id" character varying, "last_name" character varying, "phone" character varying, "status" "public"."contact_status_enum" NOT NULL DEFAULT 'lead', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "program_id" uuid NOT NULL, CONSTRAINT "PK_b77c91f220387c3c90df787bce5" PRIMARY KEY ("contact_id"))`);
        await queryRunner.query(`CREATE TABLE "purchase" ("purchase_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "item_id" character varying NOT NULL, "contact_id" uuid NOT NULL, "amount" numeric NOT NULL, "utm_params" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "promoter_id" uuid NOT NULL, "link_id" uuid, CONSTRAINT "PK_fb8b774c1e9156a025b67133750" PRIMARY KEY ("purchase_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."link_status_enum" AS ENUM('active', 'archived')`);
        await queryRunner.query(`CREATE TABLE "link" ("link_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "ref_val" character varying NOT NULL, "status" "public"."link_status_enum" NOT NULL DEFAULT 'active', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "program_id" uuid NOT NULL, "promoter_id" uuid NOT NULL, CONSTRAINT "PK_2c169f0fae14774f9787954ae6f" PRIMARY KEY ("link_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_799c56c4ad5e38b97afe9dad8d" ON "link" ("ref_val", "program_id") `);
        await queryRunner.query(`CREATE TABLE "sign_up" ("contact_id" uuid NOT NULL, "utm_params" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "promoter_id" uuid NOT NULL, "link_id" uuid NOT NULL, CONSTRAINT "PK_c795a64a8956593dc834d5d278b" PRIMARY KEY ("contact_id"))`);
        await queryRunner.query(`CREATE TABLE "program_promoter" ("program_id" uuid NOT NULL, "promoter_id" uuid NOT NULL, "accepted_terms_and_conditions" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_962c05e02f60d5c579897e7ee18" PRIMARY KEY ("program_id", "promoter_id"))`);
        await queryRunner.query(`CREATE TABLE "member" ("member_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "program_id" uuid, CONSTRAINT "program_id_email_unique" UNIQUE ("program_id", "email"), CONSTRAINT "PK_73e1828d94de0b2ddf89da05463" PRIMARY KEY ("member_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."promoter_member_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(`CREATE TYPE "public"."promoter_member_role_enum" AS ENUM('admin', 'editor', 'viewer')`);
        await queryRunner.query(`CREATE TABLE "promoter_member" ("promoter_id" uuid NOT NULL, "member_id" uuid NOT NULL, "status" "public"."promoter_member_status_enum" NOT NULL DEFAULT 'active', "role" "public"."promoter_member_role_enum" NOT NULL DEFAULT 'viewer', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6ceb1b5a3d8db6a61d86e795b2e" PRIMARY KEY ("promoter_id", "member_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."promoter_status_enum" AS ENUM('active', 'archived')`);
        await queryRunner.query(`CREATE TABLE "promoter" ("promoter_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "logo_url" character varying, "status" "public"."promoter_status_enum" NOT NULL DEFAULT 'active', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f496acc776e708cae318d49c16a" PRIMARY KEY ("promoter_id"))`);
        await queryRunner.query(`CREATE TABLE "circle_promoter" ("circle_id" uuid NOT NULL, "promoter_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4ff1a30947984b4a64bfda525be" PRIMARY KEY ("circle_id", "promoter_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."condition_parameter_enum" AS ENUM('no. of signups', 'no. of purchases', 'item_id')`);
        await queryRunner.query(`CREATE TYPE "public"."condition_operator_enum" AS ENUM('less_than_or_equal_to', 'less_than', 'equals', 'contains')`);
        await queryRunner.query(`CREATE TABLE "condition" ("condition_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "parameter" "public"."condition_parameter_enum" NOT NULL, "operator" "public"."condition_operator_enum" NOT NULL, "value" character varying NOT NULL, "function_id" uuid, CONSTRAINT "PK_842f840ae3a680df42ab08c8616" PRIMARY KEY ("condition_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."function_trigger_enum" AS ENUM('signup', 'purchase')`);
        await queryRunner.query(`CREATE TYPE "public"."function_effect_type_enum" AS ENUM('switch_circle', 'generate_commission')`);
        await queryRunner.query(`CREATE TYPE "public"."function_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(`CREATE TABLE "function" ("function_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "trigger" "public"."function_trigger_enum" NOT NULL, "effect_type" "public"."function_effect_type_enum" NOT NULL DEFAULT 'generate_commission', "effect" jsonb NOT NULL, "status" "public"."function_status_enum" NOT NULL DEFAULT 'active', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "circle_id" uuid NOT NULL, "program_id" uuid NOT NULL, CONSTRAINT "PK_6129f598a8df4ea4aaadd8b929f" PRIMARY KEY ("function_id"))`);
        await queryRunner.query(`CREATE TABLE "circle" ("circle_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "is_default_circle" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "program_id" uuid NOT NULL, CONSTRAINT "PK_08744ec19c2b01f4c29faacc393" PRIMARY KEY ("circle_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('super_admin', 'admin', 'editor', 'viewer', 'regular')`);
        await queryRunner.query(`CREATE TABLE "user" ("user_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL DEFAULT 'regular', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_758b8ce7c18b9d347461b30228d" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."program_user_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(`CREATE TYPE "public"."program_user_role_enum" AS ENUM('super_admin', 'admin', 'editor', 'viewer', 'regular')`);
        await queryRunner.query(`CREATE TABLE "program_user" ("program_id" uuid NOT NULL, "user_id" uuid NOT NULL, "status" "public"."program_user_status_enum" NOT NULL DEFAULT 'active', "role" "public"."program_user_role_enum" NOT NULL DEFAULT 'viewer', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ca45ab30487a8daececdaa8a02f" PRIMARY KEY ("program_id", "user_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."api_key_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(`CREATE TABLE "api_key" ("api_key_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "secret" character varying NOT NULL, "status" "public"."api_key_status_enum" NOT NULL DEFAULT 'active', "program_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "UQ_fb080786c16de6ace7ed0b69f7d" UNIQUE ("key"), CONSTRAINT "PK_febd1522b7c552bbe6987e7b51f" PRIMARY KEY ("api_key_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fb080786c16de6ace7ed0b69f7" ON "api_key" ("key") `);
        await queryRunner.query(`CREATE TYPE "public"."program_visibility_enum" AS ENUM('public', 'private')`);
        await queryRunner.query(`CREATE TYPE "public"."program_referral_key_type_enum" AS ENUM('email', 'phone')`);
        await queryRunner.query(`CREATE TYPE "public"."program_date_format_enum" AS ENUM('DD/MM/YYYY', 'YYYY/MM/DD', 'MM/DD/YYYY')`);
        await queryRunner.query(`CREATE TABLE "program" ("program_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "website" character varying NOT NULL, "visibility" "public"."program_visibility_enum" NOT NULL DEFAULT 'public', "currency" character varying NOT NULL, "referral_key_type" "public"."program_referral_key_type_enum" NOT NULL, "logo_url" character varying, "theme_color" character varying NOT NULL DEFAULT '', "terms_and_conditions" character varying NOT NULL DEFAULT '', "date_format" "public"."program_date_format_enum" NOT NULL DEFAULT 'DD/MM/YYYY', "time_zone" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_53f58709c0270f634ebc233c52c" PRIMARY KEY ("program_id"))`);
        await queryRunner.query(`CREATE TABLE "webhook" ("webhook_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "program_id" uuid NOT NULL, "secret" character varying NOT NULL, "events" character varying array NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d6a804c21e268e248929f763ef9" PRIMARY KEY ("webhook_id"))`);
        await queryRunner.query(`ALTER TABLE "commission" ADD CONSTRAINT "FK_80d0bf1d09df59e050ebcbf9523" FOREIGN KEY ("contact_id") REFERENCES "contact"("contact_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commission" ADD CONSTRAINT "FK_66e005fb863cf9415bfe00e5209" FOREIGN KEY ("promoter_id") REFERENCES "promoter"("promoter_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commission" ADD CONSTRAINT "FK_955b396caf603c299b735fd41c7" FOREIGN KEY ("link_id") REFERENCES "link"("link_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contact" ADD CONSTRAINT "FK_c369b0744b568b57e873cf88918" FOREIGN KEY ("program_id") REFERENCES "program"("program_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase" ADD CONSTRAINT "FK_a4ea159c479503d4b64fb223f58" FOREIGN KEY ("link_id") REFERENCES "link"("link_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase" ADD CONSTRAINT "FK_e86d6010397e445ce2016d7880a" FOREIGN KEY ("promoter_id") REFERENCES "promoter"("promoter_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase" ADD CONSTRAINT "FK_b8d2f680be4de906782982abf91" FOREIGN KEY ("contact_id") REFERENCES "contact"("contact_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "link" ADD CONSTRAINT "FK_62f88b546b2692d3e1e0adde2c8" FOREIGN KEY ("program_id") REFERENCES "program"("program_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "link" ADD CONSTRAINT "FK_04cc9a19abed9f69f007d2efbd1" FOREIGN KEY ("promoter_id") REFERENCES "promoter"("promoter_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sign_up" ADD CONSTRAINT "FK_c795a64a8956593dc834d5d278b" FOREIGN KEY ("contact_id") REFERENCES "contact"("contact_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sign_up" ADD CONSTRAINT "FK_b98d88f092bcd1444537a281d39" FOREIGN KEY ("promoter_id") REFERENCES "promoter"("promoter_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sign_up" ADD CONSTRAINT "FK_a819e2dcfb58d9a31647a169177" FOREIGN KEY ("link_id") REFERENCES "link"("link_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "program_promoter" ADD CONSTRAINT "FK_93fe2cc5e07091fa30d7d22001a" FOREIGN KEY ("program_id") REFERENCES "program"("program_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "program_promoter" ADD CONSTRAINT "FK_2e7950ea53add840dc7d79d624a" FOREIGN KEY ("promoter_id") REFERENCES "promoter"("promoter_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "member" ADD CONSTRAINT "FK_494edefd8ea279114a413eb9c2a" FOREIGN KEY ("program_id") REFERENCES "program"("program_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "promoter_member" ADD CONSTRAINT "FK_9e171d7ffe319fefc1d84702a64" FOREIGN KEY ("promoter_id") REFERENCES "promoter"("promoter_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "promoter_member" ADD CONSTRAINT "FK_67f29bc5b7be6abbbb1f9f04207" FOREIGN KEY ("member_id") REFERENCES "member"("member_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "circle_promoter" ADD CONSTRAINT "FK_b82beaf48ef7171c478962dbe2b" FOREIGN KEY ("circle_id") REFERENCES "circle"("circle_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "circle_promoter" ADD CONSTRAINT "FK_359058f838541320812ce0c9527" FOREIGN KEY ("promoter_id") REFERENCES "promoter"("promoter_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "condition" ADD CONSTRAINT "FK_ff56e8b916122f2ed65abb5598b" FOREIGN KEY ("function_id") REFERENCES "function"("function_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "function" ADD CONSTRAINT "FK_879b535e416a2458ce582322d80" FOREIGN KEY ("circle_id") REFERENCES "circle"("circle_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "function" ADD CONSTRAINT "FK_f60276fc5f0fd8827d373d34300" FOREIGN KEY ("program_id") REFERENCES "program"("program_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "circle" ADD CONSTRAINT "FK_a633e8b1bd1b9971472346194e8" FOREIGN KEY ("program_id") REFERENCES "program"("program_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "program_user" ADD CONSTRAINT "FK_d0aa650710ea93d56e39c8ec53c" FOREIGN KEY ("program_id") REFERENCES "program"("program_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "program_user" ADD CONSTRAINT "FK_fb84966f083d85ee02aebd75f9a" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "api_key" ADD CONSTRAINT "FK_b5b356e8c1c4fc6e1532047b7d1" FOREIGN KEY ("program_id") REFERENCES "program"("program_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "webhook" ADD CONSTRAINT "FK_4ead5f518f190a6fb249cec2e60" FOREIGN KEY ("program_id") REFERENCES "program"("program_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE MATERIALIZED VIEW "referral_mv" AS SELECT "contact"."status" AS "status", combined.program_id AS "program_id", combined.promoter_id AS "promoter_id", combined.contact_id AS "contact_id", SUM(combined.total_revenue) AS "total_revenue", SUM(combined.total_commission) AS "total_commission", MAX(combined.updated_at) AS "updated_at", MIN(combined.created_at) AS "created_at", 
			CASE 
			WHEN "program"."referral_key_type" = 'email' THEN "contact"."email" 
			ELSE "contact"."phone" 
			END
		 AS "contact_info" FROM (
		(SELECT "c"."program_id" AS "program_id", "pu"."promoter_id" AS "promoter_id", "c"."contact_id" AS "contact_id", SUM("pu"."amount") AS "total_revenue", 0 AS "total_commission", MAX("pu"."updated_at") AS "updated_at", MIN("pu"."created_at") AS "created_at" FROM "contact" "c" INNER JOIN "purchase" "pu" ON "pu"."contact_id" = "c"."contact_id" GROUP BY "c"."program_id", "pu"."promoter_id", "c"."contact_id") 
		UNION ALL 
		(SELECT "c"."program_id" AS "program_id", "com"."promoter_id" AS "promoter_id", "c"."contact_id" AS "contact_id", 0 AS "total_revenue", SUM("com"."amount") AS "total_commission", MAX("com"."updated_at") AS "updated_at", MIN("com"."created_at") AS "created_at" FROM "contact" "c" INNER JOIN "commission" "com" ON "com"."contact_id" = "c"."contact_id" GROUP BY "c"."program_id", "com"."promoter_id", "c"."contact_id") 
		UNION ALL 
		(SELECT "c"."program_id" AS "program_id", "su"."promoter_id" AS "promoter_id", "su"."contact_id" AS "contact_id", 0 AS "total_revenue", 0 AS "total_commission", MAX("su"."updated_at") AS "updated_at", MIN("su"."created_at") AS "created_at" FROM "sign_up" "su" INNER JOIN "contact" "c" ON "c"."contact_id" = "su"."contact_id" GROUP BY "c"."program_id", "su"."promoter_id", "su"."contact_id")
	) "combined" INNER JOIN "contact" "contact" ON "contact"."contact_id" = combined.contact_id  INNER JOIN "program" "program" ON "program"."program_id" = combined.program_id GROUP BY combined.program_id, "contact"."status", combined.promoter_id, combined.contact_id, "contact"."email", "contact"."phone", "program"."referral_key_type"`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","MATERIALIZED_VIEW","referral_mv","SELECT \"contact\".\"status\" AS \"status\", combined.program_id AS \"program_id\", combined.promoter_id AS \"promoter_id\", combined.contact_id AS \"contact_id\", SUM(combined.total_revenue) AS \"total_revenue\", SUM(combined.total_commission) AS \"total_commission\", MAX(combined.updated_at) AS \"updated_at\", MIN(combined.created_at) AS \"created_at\", \n\t\t\tCASE \n\t\t\tWHEN \"program\".\"referral_key_type\" = 'email' THEN \"contact\".\"email\" \n\t\t\tELSE \"contact\".\"phone\" \n\t\t\tEND\n\t\t AS \"contact_info\" FROM (\n\t\t(SELECT \"c\".\"program_id\" AS \"program_id\", \"pu\".\"promoter_id\" AS \"promoter_id\", \"c\".\"contact_id\" AS \"contact_id\", SUM(\"pu\".\"amount\") AS \"total_revenue\", 0 AS \"total_commission\", MAX(\"pu\".\"updated_at\") AS \"updated_at\", MIN(\"pu\".\"created_at\") AS \"created_at\" FROM \"contact\" \"c\" INNER JOIN \"purchase\" \"pu\" ON \"pu\".\"contact_id\" = \"c\".\"contact_id\" GROUP BY \"c\".\"program_id\", \"pu\".\"promoter_id\", \"c\".\"contact_id\") \n\t\tUNION ALL \n\t\t(SELECT \"c\".\"program_id\" AS \"program_id\", \"com\".\"promoter_id\" AS \"promoter_id\", \"c\".\"contact_id\" AS \"contact_id\", 0 AS \"total_revenue\", SUM(\"com\".\"amount\") AS \"total_commission\", MAX(\"com\".\"updated_at\") AS \"updated_at\", MIN(\"com\".\"created_at\") AS \"created_at\" FROM \"contact\" \"c\" INNER JOIN \"commission\" \"com\" ON \"com\".\"contact_id\" = \"c\".\"contact_id\" GROUP BY \"c\".\"program_id\", \"com\".\"promoter_id\", \"c\".\"contact_id\") \n\t\tUNION ALL \n\t\t(SELECT \"c\".\"program_id\" AS \"program_id\", \"su\".\"promoter_id\" AS \"promoter_id\", \"su\".\"contact_id\" AS \"contact_id\", 0 AS \"total_revenue\", 0 AS \"total_commission\", MAX(\"su\".\"updated_at\") AS \"updated_at\", MIN(\"su\".\"created_at\") AS \"created_at\" FROM \"sign_up\" \"su\" INNER JOIN \"contact\" \"c\" ON \"c\".\"contact_id\" = \"su\".\"contact_id\" GROUP BY \"c\".\"program_id\", \"su\".\"promoter_id\", \"su\".\"contact_id\")\n\t) \"combined\" INNER JOIN \"contact\" \"contact\" ON \"contact\".\"contact_id\" = combined.contact_id  INNER JOIN \"program\" \"program\" ON \"program\".\"program_id\" = combined.program_id GROUP BY combined.program_id, \"contact\".\"status\", combined.promoter_id, combined.contact_id, \"contact\".\"email\", \"contact\".\"phone\", \"program\".\"referral_key_type\""]);
        await queryRunner.query(`CREATE MATERIALIZED VIEW "promoter_analytics_mv" AS SELECT "pp"."program_id" AS "program_id", "pp"."promoter_id" AS "promoter_id", COALESCE(rv.total_revenue, 0) AS "total_revenue", COALESCE(rv.total_commission, 0) AS "total_commission", COALESCE(su.total_signups, 0) AS "total_signups", COALESCE(pu.total_purchases, 0) AS "total_purchases" FROM "program_promoter" "pp" INNER JOIN "promoter" "pr" ON "pp"."promoter_id" = "pr"."promoter_id"  LEFT JOIN (SELECT "rv"."program_id" AS "program_id", "rv"."promoter_id" AS "promoter_id", SUM("rv"."total_revenue") AS "total_revenue", SUM("rv"."total_commission") AS "total_commission" FROM "referral_mv" "rv" GROUP BY "rv"."program_id", "rv"."promoter_id") "rv" ON rv.program_id = "pp"."program_id" AND rv.promoter_id = "pp"."promoter_id"  LEFT JOIN (SELECT "c"."program_id" AS "program_id", "s"."promoter_id" AS "promoter_id", COUNT(DISTINCT "s"."contact_id") AS "total_signups" FROM "sign_up" "s" INNER JOIN "contact" "c" ON "s"."contact_id" = "c"."contact_id" GROUP BY "c"."program_id", "s"."promoter_id") "su" ON su.program_id = "pp"."program_id" AND su.promoter_id = "pp"."promoter_id"  LEFT JOIN (SELECT "c"."program_id" AS "program_id", "p"."promoter_id" AS "promoter_id", COUNT(DISTINCT "p"."purchase_id") AS "total_purchases" FROM "purchase" "p" INNER JOIN "contact" "c" ON "p"."contact_id" = "c"."contact_id" GROUP BY "c"."program_id", "p"."promoter_id") "pu" ON pu.program_id = "pp"."program_id" AND pu.promoter_id = "pp"."promoter_id" WHERE "pr"."status" = 'active'`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","MATERIALIZED_VIEW","promoter_analytics_mv","SELECT \"pp\".\"program_id\" AS \"program_id\", \"pp\".\"promoter_id\" AS \"promoter_id\", COALESCE(rv.total_revenue, 0) AS \"total_revenue\", COALESCE(rv.total_commission, 0) AS \"total_commission\", COALESCE(su.total_signups, 0) AS \"total_signups\", COALESCE(pu.total_purchases, 0) AS \"total_purchases\" FROM \"program_promoter\" \"pp\" INNER JOIN \"promoter\" \"pr\" ON \"pp\".\"promoter_id\" = \"pr\".\"promoter_id\"  LEFT JOIN (SELECT \"rv\".\"program_id\" AS \"program_id\", \"rv\".\"promoter_id\" AS \"promoter_id\", SUM(\"rv\".\"total_revenue\") AS \"total_revenue\", SUM(\"rv\".\"total_commission\") AS \"total_commission\" FROM \"referral_mv\" \"rv\" GROUP BY \"rv\".\"program_id\", \"rv\".\"promoter_id\") \"rv\" ON rv.program_id = \"pp\".\"program_id\" AND rv.promoter_id = \"pp\".\"promoter_id\"  LEFT JOIN (SELECT \"c\".\"program_id\" AS \"program_id\", \"s\".\"promoter_id\" AS \"promoter_id\", COUNT(DISTINCT \"s\".\"contact_id\") AS \"total_signups\" FROM \"sign_up\" \"s\" INNER JOIN \"contact\" \"c\" ON \"s\".\"contact_id\" = \"c\".\"contact_id\" GROUP BY \"c\".\"program_id\", \"s\".\"promoter_id\") \"su\" ON su.program_id = \"pp\".\"program_id\" AND su.promoter_id = \"pp\".\"promoter_id\"  LEFT JOIN (SELECT \"c\".\"program_id\" AS \"program_id\", \"p\".\"promoter_id\" AS \"promoter_id\", COUNT(DISTINCT \"p\".\"purchase_id\") AS \"total_purchases\" FROM \"purchase\" \"p\" INNER JOIN \"contact\" \"c\" ON \"p\".\"contact_id\" = \"c\".\"contact_id\" GROUP BY \"c\".\"program_id\", \"p\".\"promoter_id\") \"pu\" ON pu.program_id = \"pp\".\"program_id\" AND pu.promoter_id = \"pp\".\"promoter_id\" WHERE \"pr\".\"status\" = 'active'"]);
        await queryRunner.query(`CREATE MATERIALIZED VIEW "link_analytics_mv" AS SELECT "l"."name" AS "name", "l"."link_id" AS "link_id", "l"."ref_val" AS "ref_val", "l"."program_id" AS "program_id", "l"."promoter_id" AS "promoter_id", COALESCE(s.signups, 0) AS "signups", COALESCE(p.purchases, 0) AS "purchases", COALESCE(c.total_commission, 0) AS "commission", "l"."created_at" AS "created_at" FROM "link" "l" LEFT JOIN (SELECT "s"."link_id" AS "link_id", COUNT("s"."contact_id") AS "signups" FROM "sign_up" "s" GROUP BY "s"."link_id") "s" ON s.link_id = "l"."link_id"  LEFT JOIN (SELECT "pu"."link_id" AS "link_id", COUNT("pu"."purchase_id") AS "purchases" FROM "purchase" "pu" GROUP BY "pu"."link_id") "p" ON p.link_id = "l"."link_id"  LEFT JOIN (SELECT "com"."link_id" AS "link_id", SUM("com"."amount") AS "total_commission" FROM "commission" "com" GROUP BY "com"."link_id") "c" ON c.link_id = "l"."link_id" WHERE "l"."status" = 'active'`);
        await queryRunner.query(`INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","MATERIALIZED_VIEW","link_analytics_mv","SELECT \"l\".\"name\" AS \"name\", \"l\".\"link_id\" AS \"link_id\", \"l\".\"ref_val\" AS \"ref_val\", \"l\".\"program_id\" AS \"program_id\", \"l\".\"promoter_id\" AS \"promoter_id\", COALESCE(s.signups, 0) AS \"signups\", COALESCE(p.purchases, 0) AS \"purchases\", COALESCE(c.total_commission, 0) AS \"commission\", \"l\".\"created_at\" AS \"created_at\" FROM \"link\" \"l\" LEFT JOIN (SELECT \"s\".\"link_id\" AS \"link_id\", COUNT(\"s\".\"contact_id\") AS \"signups\" FROM \"sign_up\" \"s\" GROUP BY \"s\".\"link_id\") \"s\" ON s.link_id = \"l\".\"link_id\"  LEFT JOIN (SELECT \"pu\".\"link_id\" AS \"link_id\", COUNT(\"pu\".\"purchase_id\") AS \"purchases\" FROM \"purchase\" \"pu\" GROUP BY \"pu\".\"link_id\") \"p\" ON p.link_id = \"l\".\"link_id\"  LEFT JOIN (SELECT \"com\".\"link_id\" AS \"link_id\", SUM(\"com\".\"amount\") AS \"total_commission\" FROM \"commission\" \"com\" GROUP BY \"com\".\"link_id\") \"c\" ON c.link_id = \"l\".\"link_id\" WHERE \"l\".\"status\" = 'active'"]);
        await queryRunner.query(`CREATE INDEX "IDX_0bafbef03a91712f4525d7910b" ON "referral_mv" ("program_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9f1149620f218741615ee520f1" ON "referral_mv" ("promoter_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b14e18b5c18a2284d0a3fd0172" ON "referral_mv" ("contact_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_88ca6797fd878bfd0557664e7d" ON "promoter_analytics_mv" ("program_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9e806f1e2e627bfa6c8b39b02f" ON "promoter_analytics_mv" ("promoter_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3fd775adfced33a6fedee275db" ON "link_analytics_mv" ("ref_val") `);
        await queryRunner.query(`CREATE INDEX "IDX_97e7f8a915668a2b2367f50de4" ON "link_analytics_mv" ("promoter_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7453c64b6153e538369ae9dc93" ON "link_analytics_mv" ("program_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_7453c64b6153e538369ae9dc93"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97e7f8a915668a2b2367f50de4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3fd775adfced33a6fedee275db"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9e806f1e2e627bfa6c8b39b02f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88ca6797fd878bfd0557664e7d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b14e18b5c18a2284d0a3fd0172"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f1149620f218741615ee520f1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0bafbef03a91712f4525d7910b"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["MATERIALIZED_VIEW","link_analytics_mv","public"]);
        await queryRunner.query(`DROP MATERIALIZED VIEW "link_analytics_mv"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["MATERIALIZED_VIEW","promoter_analytics_mv","public"]);
        await queryRunner.query(`DROP MATERIALIZED VIEW "promoter_analytics_mv"`);
        await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["MATERIALIZED_VIEW","referral_mv","public"]);
        await queryRunner.query(`DROP MATERIALIZED VIEW "referral_mv"`);
        await queryRunner.query(`ALTER TABLE "webhook" DROP CONSTRAINT "FK_4ead5f518f190a6fb249cec2e60"`);
        await queryRunner.query(`ALTER TABLE "api_key" DROP CONSTRAINT "FK_b5b356e8c1c4fc6e1532047b7d1"`);
        await queryRunner.query(`ALTER TABLE "program_user" DROP CONSTRAINT "FK_fb84966f083d85ee02aebd75f9a"`);
        await queryRunner.query(`ALTER TABLE "program_user" DROP CONSTRAINT "FK_d0aa650710ea93d56e39c8ec53c"`);
        await queryRunner.query(`ALTER TABLE "circle" DROP CONSTRAINT "FK_a633e8b1bd1b9971472346194e8"`);
        await queryRunner.query(`ALTER TABLE "function" DROP CONSTRAINT "FK_f60276fc5f0fd8827d373d34300"`);
        await queryRunner.query(`ALTER TABLE "function" DROP CONSTRAINT "FK_879b535e416a2458ce582322d80"`);
        await queryRunner.query(`ALTER TABLE "condition" DROP CONSTRAINT "FK_ff56e8b916122f2ed65abb5598b"`);
        await queryRunner.query(`ALTER TABLE "circle_promoter" DROP CONSTRAINT "FK_359058f838541320812ce0c9527"`);
        await queryRunner.query(`ALTER TABLE "circle_promoter" DROP CONSTRAINT "FK_b82beaf48ef7171c478962dbe2b"`);
        await queryRunner.query(`ALTER TABLE "promoter_member" DROP CONSTRAINT "FK_67f29bc5b7be6abbbb1f9f04207"`);
        await queryRunner.query(`ALTER TABLE "promoter_member" DROP CONSTRAINT "FK_9e171d7ffe319fefc1d84702a64"`);
        await queryRunner.query(`ALTER TABLE "member" DROP CONSTRAINT "FK_494edefd8ea279114a413eb9c2a"`);
        await queryRunner.query(`ALTER TABLE "program_promoter" DROP CONSTRAINT "FK_2e7950ea53add840dc7d79d624a"`);
        await queryRunner.query(`ALTER TABLE "program_promoter" DROP CONSTRAINT "FK_93fe2cc5e07091fa30d7d22001a"`);
        await queryRunner.query(`ALTER TABLE "sign_up" DROP CONSTRAINT "FK_a819e2dcfb58d9a31647a169177"`);
        await queryRunner.query(`ALTER TABLE "sign_up" DROP CONSTRAINT "FK_b98d88f092bcd1444537a281d39"`);
        await queryRunner.query(`ALTER TABLE "sign_up" DROP CONSTRAINT "FK_c795a64a8956593dc834d5d278b"`);
        await queryRunner.query(`ALTER TABLE "link" DROP CONSTRAINT "FK_04cc9a19abed9f69f007d2efbd1"`);
        await queryRunner.query(`ALTER TABLE "link" DROP CONSTRAINT "FK_62f88b546b2692d3e1e0adde2c8"`);
        await queryRunner.query(`ALTER TABLE "purchase" DROP CONSTRAINT "FK_b8d2f680be4de906782982abf91"`);
        await queryRunner.query(`ALTER TABLE "purchase" DROP CONSTRAINT "FK_e86d6010397e445ce2016d7880a"`);
        await queryRunner.query(`ALTER TABLE "purchase" DROP CONSTRAINT "FK_a4ea159c479503d4b64fb223f58"`);
        await queryRunner.query(`ALTER TABLE "contact" DROP CONSTRAINT "FK_c369b0744b568b57e873cf88918"`);
        await queryRunner.query(`ALTER TABLE "commission" DROP CONSTRAINT "FK_955b396caf603c299b735fd41c7"`);
        await queryRunner.query(`ALTER TABLE "commission" DROP CONSTRAINT "FK_66e005fb863cf9415bfe00e5209"`);
        await queryRunner.query(`ALTER TABLE "commission" DROP CONSTRAINT "FK_80d0bf1d09df59e050ebcbf9523"`);
        await queryRunner.query(`DROP TABLE "webhook"`);
        await queryRunner.query(`DROP TABLE "program"`);
        await queryRunner.query(`DROP TYPE "public"."program_date_format_enum"`);
        await queryRunner.query(`DROP TYPE "public"."program_referral_key_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."program_visibility_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fb080786c16de6ace7ed0b69f7"`);
        await queryRunner.query(`DROP TABLE "api_key"`);
        await queryRunner.query(`DROP TYPE "public"."api_key_status_enum"`);
        await queryRunner.query(`DROP TABLE "program_user"`);
        await queryRunner.query(`DROP TYPE "public"."program_user_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."program_user_status_enum"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "circle"`);
        await queryRunner.query(`DROP TABLE "function"`);
        await queryRunner.query(`DROP TYPE "public"."function_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."function_effect_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."function_trigger_enum"`);
        await queryRunner.query(`DROP TABLE "condition"`);
        await queryRunner.query(`DROP TYPE "public"."condition_operator_enum"`);
        await queryRunner.query(`DROP TYPE "public"."condition_parameter_enum"`);
        await queryRunner.query(`DROP TABLE "circle_promoter"`);
        await queryRunner.query(`DROP TABLE "promoter"`);
        await queryRunner.query(`DROP TYPE "public"."promoter_status_enum"`);
        await queryRunner.query(`DROP TABLE "promoter_member"`);
        await queryRunner.query(`DROP TYPE "public"."promoter_member_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."promoter_member_status_enum"`);
        await queryRunner.query(`DROP TABLE "member"`);
        await queryRunner.query(`DROP TABLE "program_promoter"`);
        await queryRunner.query(`DROP TABLE "sign_up"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_799c56c4ad5e38b97afe9dad8d"`);
        await queryRunner.query(`DROP TABLE "link"`);
        await queryRunner.query(`DROP TYPE "public"."link_status_enum"`);
        await queryRunner.query(`DROP TABLE "purchase"`);
        await queryRunner.query(`DROP TABLE "contact"`);
        await queryRunner.query(`DROP TYPE "public"."contact_status_enum"`);
        await queryRunner.query(`DROP TABLE "commission"`);
        await queryRunner.query(`DROP TYPE "public"."commission_conversion_type_enum"`);
    }

}
