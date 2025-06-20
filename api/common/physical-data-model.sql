-- This script was generated by the ERD tool in pgAdmin 4.
-- Please log an issue at https://github.com/pgadmin-org/pgadmin4/issues/new/choose if you find any bugs, including reproduction steps.
BEGIN;


CREATE TABLE IF NOT EXISTS public.circle
(
    circle_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    program_id uuid,
    CONSTRAINT "PK_08744ec19c2b01f4c29faacc393" PRIMARY KEY (circle_id)
);

CREATE TABLE IF NOT EXISTS public.circle_promoter
(
    circle_id uuid NOT NULL,
    promoter_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "PK_4ff1a30947984b4a64bfda525be" PRIMARY KEY (circle_id, promoter_id)
);

CREATE TABLE IF NOT EXISTS public.contact
(
    contact_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    promoter_id uuid,
    link_id uuid,
    status contact_status_enum NOT NULL,
    email character varying COLLATE pg_catalog."default" NOT NULL,
    first_name character varying COLLATE pg_catalog."default" NOT NULL,
    last_name character varying COLLATE pg_catalog."default" NOT NULL,
    phone character varying COLLATE pg_catalog."default" NOT NULL,
    program_id uuid,
    CONSTRAINT "PK_b77c91f220387c3c90df787bce5" PRIMARY KEY (contact_id),
    CONSTRAINT "UQ_45ef3dc8b9b3b669d70f9d4dc12" UNIQUE (promoter_id)
);

CREATE TABLE IF NOT EXISTS public.function
(
    function_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    commission_value character varying COLLATE pg_catalog."default" NOT NULL,
    conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
    effect character varying COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    circle_id uuid,
    program_id uuid,
    trigger function_trigger_enum NOT NULL,
    commission_type function_commission_type_enum NOT NULL,
    status function_status_enum NOT NULL DEFAULT 'active'::function_status_enum,
    CONSTRAINT "PK_6129f598a8df4ea4aaadd8b929f" PRIMARY KEY (function_id)
);

CREATE TABLE IF NOT EXISTS public.link
(
    link_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying COLLATE pg_catalog."default" NOT NULL,
    url character varying COLLATE pg_catalog."default" NOT NULL,
    source character varying COLLATE pg_catalog."default" NOT NULL,
    medium character varying COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    program_id uuid,
    promoter_id uuid,
    CONSTRAINT "PK_2c169f0fae14774f9787954ae6f" PRIMARY KEY (link_id)
);

CREATE TABLE IF NOT EXISTS public.member
(
    member_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    email character varying COLLATE pg_catalog."default" NOT NULL,
    password character varying COLLATE pg_catalog."default" NOT NULL,
    first_name character varying COLLATE pg_catalog."default" NOT NULL,
    last_name character varying COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    program_id uuid,
    CONSTRAINT "PK_73e1828d94de0b2ddf89da05463" PRIMARY KEY (member_id),
    CONSTRAINT program_id_email_unique UNIQUE (program_id, email)
);

CREATE TABLE IF NOT EXISTS public.program
(
    program_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying COLLATE pg_catalog."default" NOT NULL,
    website character varying COLLATE pg_catalog."default" NOT NULL,
    currency character varying COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    visibility program_visibility_enum NOT NULL DEFAULT 'public'::program_visibility_enum,
    CONSTRAINT "PK_53f58709c0270f634ebc233c52c" PRIMARY KEY (program_id)
);

CREATE TABLE IF NOT EXISTS public.program_promoter
(
    program_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    promoter_id uuid NOT NULL,
    CONSTRAINT "PK_962c05e02f60d5c579897e7ee18" PRIMARY KEY (program_id, promoter_id)
);

CREATE TABLE IF NOT EXISTS public.program_user
(
    program_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    status program_user_status_enum NOT NULL DEFAULT 'active'::program_user_status_enum,
    role program_user_role_enum NOT NULL DEFAULT 'member'::program_user_role_enum,
    CONSTRAINT "PK_ca45ab30487a8daececdaa8a02f" PRIMARY KEY (program_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.promoter
(
    promoter_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying COLLATE pg_catalog."default" NOT NULL,
    logo_url character varying COLLATE pg_catalog."default" NOT NULL,
    theme_color character varying COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "PK_f496acc776e708cae318d49c16a" PRIMARY KEY (promoter_id)
);

CREATE TABLE IF NOT EXISTS public.promoter_member
(
    member_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    promoter_id uuid NOT NULL,
    status promoter_member_status_enum NOT NULL DEFAULT 'active'::promoter_member_status_enum,
    role promoter_member_role_enum NOT NULL DEFAULT 'member'::promoter_member_role_enum,
    CONSTRAINT "PK_6ceb1b5a3d8db6a61d86e795b2e" PRIMARY KEY (promoter_id, member_id)
);

CREATE TABLE IF NOT EXISTS public.purchase
(
    purchase_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    external_id character varying COLLATE pg_catalog."default" NOT NULL,
    contact_id character varying COLLATE pg_catalog."default" NOT NULL,
    amount numeric NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    link_id uuid,
    promoter_id uuid,
    CONSTRAINT "PK_fb8b774c1e9156a025b67133750" PRIMARY KEY (purchase_id)
);

CREATE TABLE IF NOT EXISTS public."user"
(
    user_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    email character varying COLLATE pg_catalog."default" NOT NULL,
    password character varying COLLATE pg_catalog."default" NOT NULL,
    first_name character varying COLLATE pg_catalog."default" NOT NULL,
    last_name character varying COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "PK_758b8ce7c18b9d347461b30228d" PRIMARY KEY (user_id),
    CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE (email)
);

ALTER TABLE IF EXISTS public.circle
    ADD CONSTRAINT "FK_a633e8b1bd1b9971472346194e8" FOREIGN KEY (program_id)
    REFERENCES public.program (program_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.circle_promoter
    ADD CONSTRAINT "FK_359058f838541320812ce0c9527" FOREIGN KEY (promoter_id)
    REFERENCES public.promoter (promoter_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.circle_promoter
    ADD CONSTRAINT "FK_b82beaf48ef7171c478962dbe2b" FOREIGN KEY (circle_id)
    REFERENCES public.circle (circle_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.contact
    ADD CONSTRAINT "FK_1ad354d4b6200f651eaf98c97e9" FOREIGN KEY (link_id)
    REFERENCES public.link (link_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.contact
    ADD CONSTRAINT "FK_45ef3dc8b9b3b669d70f9d4dc12" FOREIGN KEY (promoter_id)
    REFERENCES public.promoter (promoter_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
CREATE INDEX IF NOT EXISTS "UQ_45ef3dc8b9b3b669d70f9d4dc12"
    ON public.contact(promoter_id);


ALTER TABLE IF EXISTS public.contact
    ADD CONSTRAINT "FK_c369b0744b568b57e873cf88918" FOREIGN KEY (program_id)
    REFERENCES public.program (program_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.function
    ADD CONSTRAINT "FK_879b535e416a2458ce582322d80" FOREIGN KEY (circle_id)
    REFERENCES public.circle (circle_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.function
    ADD CONSTRAINT "FK_f60276fc5f0fd8827d373d34300" FOREIGN KEY (program_id)
    REFERENCES public.program (program_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.link
    ADD CONSTRAINT "FK_04cc9a19abed9f69f007d2efbd1" FOREIGN KEY (promoter_id)
    REFERENCES public.promoter (promoter_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.link
    ADD CONSTRAINT "FK_62f88b546b2692d3e1e0adde2c8" FOREIGN KEY (program_id)
    REFERENCES public.program (program_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.member
    ADD CONSTRAINT "FK_494edefd8ea279114a413eb9c2a" FOREIGN KEY (program_id)
    REFERENCES public.program (program_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.program_promoter
    ADD CONSTRAINT "FK_2e7950ea53add840dc7d79d624a" FOREIGN KEY (promoter_id)
    REFERENCES public.promoter (promoter_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.program_promoter
    ADD CONSTRAINT "FK_93fe2cc5e07091fa30d7d22001a" FOREIGN KEY (program_id)
    REFERENCES public.program (program_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.program_user
    ADD CONSTRAINT "FK_d0aa650710ea93d56e39c8ec53c" FOREIGN KEY (program_id)
    REFERENCES public.program (program_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.program_user
    ADD CONSTRAINT "FK_fb84966f083d85ee02aebd75f9a" FOREIGN KEY (user_id)
    REFERENCES public."user" (user_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.promoter_member
    ADD CONSTRAINT "FK_67f29bc5b7be6abbbb1f9f04207" FOREIGN KEY (member_id)
    REFERENCES public.member (member_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.promoter_member
    ADD CONSTRAINT "FK_9e171d7ffe319fefc1d84702a64" FOREIGN KEY (promoter_id)
    REFERENCES public.promoter (promoter_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.purchase
    ADD CONSTRAINT "FK_a4ea159c479503d4b64fb223f58" FOREIGN KEY (link_id)
    REFERENCES public.link (link_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.purchase
    ADD CONSTRAINT "FK_e86d6010397e445ce2016d7880a" FOREIGN KEY (promoter_id)
    REFERENCES public.promoter (promoter_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

END;