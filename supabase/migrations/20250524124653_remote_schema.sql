

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






-- CREATE EXTENSION IF NOT EXISTS "pgmq" WITH SCHEMA "pgmq"; -- Commented out for local development






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."match_documents"("query_embedding" "extensions"."vector", "match_threshold" double precision, "match_count" integer, "tenant_filter" "uuid") RETURNS TABLE("id" "uuid", "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
  BEGIN
    RETURN QUERY
    SELECT
      e.id,
      e.content,
      e.metadata,
      1 - (e.embedding <=> query_embedding) as similarity
    FROM ai_embeddings e
    WHERE
      e.tenant_id = tenant_filter
      AND 1 - (e.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
  END;
  $$;


ALTER FUNCTION "public"."match_documents"("query_embedding" "extensions"."vector", "match_threshold" double precision, "match_count" integer, "tenant_filter" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."active_tabs" (
    "user_id" "uuid" NOT NULL,
    "tab_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."active_tabs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_embeddings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "extensions"."vector"(1536) NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "last_activity" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."approval_stages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "order_num" integer NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "approval_stages_type_check" CHECK (("type" = ANY (ARRAY['main'::"text", 'launch'::"text"])))
);


ALTER TABLE "public"."approval_stages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."approval_statuses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."approval_statuses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "url" "text" NOT NULL,
    "type" "text" NOT NULL,
    "thumbnail_url" "text",
    "entity_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "metadata" "jsonb",
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attachments_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['feature'::"text", 'release'::"text", 'requirement'::"text", 'document'::"text"])))
);


ALTER TABLE "public"."attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "feature_id" "uuid",
    "release_id" "uuid",
    "requirement_id" "uuid",
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "priority" "text" NOT NULL,
    "description" "text",
    "interface_id" "uuid",
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "roadmap_id" "uuid",
    "is_saved" boolean DEFAULT true,
    "saved_at" timestamp with time zone,
    CONSTRAINT "features_priority_check" CHECK (("priority" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"])))
);


ALTER TABLE "public"."features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interfaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "product_id" "uuid",
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "is_saved" boolean DEFAULT true,
    "saved_at" timestamp with time zone
);


ALTER TABLE "public"."interfaces" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "is_saved" boolean DEFAULT true,
    "saved_at" timestamp with time zone
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."releases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "release_date" "date" NOT NULL,
    "priority" "text" NOT NULL,
    "feature_id" "uuid",
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "is_saved" boolean DEFAULT true,
    "saved_at" timestamp with time zone,
    CONSTRAINT "releases_priority_check" CHECK (("priority" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"])))
);


ALTER TABLE "public"."releases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."requirements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "owner" "text",
    "description" "text",
    "priority" "text",
    "feature_id" "uuid" NOT NULL,
    "release_id" "uuid",
    "cuj" "text",
    "acceptance_criteria" "text",
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "is_saved" boolean DEFAULT true,
    "saved_at" timestamp with time zone,
    CONSTRAINT "requirements_priority_check" CHECK (("priority" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"])))
);


ALTER TABLE "public"."requirements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roadmaps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_default" boolean DEFAULT false,
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_saved" boolean DEFAULT true,
    "saved_at" timestamp with time zone
);


ALTER TABLE "public"."roadmaps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tabs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "type" "text" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "is_active" boolean DEFAULT false,
    "has_changes" boolean DEFAULT false
);


ALTER TABLE "public"."tabs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_tenants" (
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."user_tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'pm'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."active_tabs"
    ADD CONSTRAINT "active_tabs_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."ai_embeddings"
    ADD CONSTRAINT "ai_embeddings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_embeddings"
    ADD CONSTRAINT "ai_embeddings_tenant_entity_unique" UNIQUE ("tenant_id", "entity_type", "entity_id");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_sessions"
    ADD CONSTRAINT "ai_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approval_stages"
    ADD CONSTRAINT "approval_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approval_statuses"
    ADD CONSTRAINT "approval_statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interfaces"
    ADD CONSTRAINT "interfaces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."releases"
    ADD CONSTRAINT "releases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."requirements"
    ADD CONSTRAINT "requirements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roadmaps"
    ADD CONSTRAINT "roadmaps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tabs"
    ADD CONSTRAINT "tabs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."user_tenants"
    ADD CONSTRAINT "user_tenants_pkey" PRIMARY KEY ("user_id", "tenant_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "ai_embeddings_embedding_idx" ON "public"."ai_embeddings" USING "hnsw" ("embedding" "extensions"."vector_cosine_ops") WITH ("m"='16', "ef_construction"='64');



CREATE INDEX "idx_approval_stages_type_order" ON "public"."approval_stages" USING "btree" ("type", "order_num");



CREATE INDEX "idx_approval_statuses_name" ON "public"."approval_statuses" USING "btree" ("name");



CREATE INDEX "idx_attachments_entity" ON "public"."attachments" USING "btree" ("entity_id", "entity_type");



CREATE INDEX "idx_documents_feature_id" ON "public"."documents" USING "btree" ("feature_id");



CREATE INDEX "idx_documents_release_id" ON "public"."documents" USING "btree" ("release_id");



CREATE INDEX "idx_documents_requirement_id" ON "public"."documents" USING "btree" ("requirement_id");



CREATE INDEX "idx_documents_tenant_id" ON "public"."documents" USING "btree" ("tenant_id");



CREATE INDEX "idx_features_is_saved" ON "public"."features" USING "btree" ("is_saved");



CREATE INDEX "idx_features_roadmap_id" ON "public"."features" USING "btree" ("roadmap_id");



CREATE INDEX "idx_features_tenant_id" ON "public"."features" USING "btree" ("tenant_id");



CREATE INDEX "idx_interfaces_is_saved" ON "public"."interfaces" USING "btree" ("is_saved");



CREATE INDEX "idx_products_is_saved" ON "public"."products" USING "btree" ("is_saved");



CREATE INDEX "idx_releases_feature_id" ON "public"."releases" USING "btree" ("feature_id");



CREATE INDEX "idx_releases_is_saved" ON "public"."releases" USING "btree" ("is_saved");



CREATE INDEX "idx_releases_tenant_id" ON "public"."releases" USING "btree" ("tenant_id");



CREATE INDEX "idx_requirements_feature_id" ON "public"."requirements" USING "btree" ("feature_id");



CREATE INDEX "idx_requirements_is_saved" ON "public"."requirements" USING "btree" ("is_saved");



CREATE INDEX "idx_requirements_release_id" ON "public"."requirements" USING "btree" ("release_id");



CREATE INDEX "idx_requirements_tenant_id" ON "public"."requirements" USING "btree" ("tenant_id");



CREATE INDEX "idx_roadmaps_is_saved" ON "public"."roadmaps" USING "btree" ("is_saved");



CREATE INDEX "idx_roadmaps_tenant_id" ON "public"."roadmaps" USING "btree" ("tenant_id");



CREATE INDEX "idx_tabs_tenant_id" ON "public"."tabs" USING "btree" ("tenant_id");



CREATE OR REPLACE TRIGGER "update_active_tabs_updated_at" BEFORE UPDATE ON "public"."active_tabs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_attachments_updated_at" BEFORE UPDATE ON "public"."attachments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_documents_updated_at" BEFORE UPDATE ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_features_updated_at" BEFORE UPDATE ON "public"."features" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_interfaces_updated_at" BEFORE UPDATE ON "public"."interfaces" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_releases_updated_at" BEFORE UPDATE ON "public"."releases" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_requirements_updated_at" BEFORE UPDATE ON "public"."requirements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_roadmaps_updated_at" BEFORE UPDATE ON "public"."roadmaps" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tabs_updated_at" BEFORE UPDATE ON "public"."tabs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tenants_updated_at" BEFORE UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."active_tabs"
    ADD CONSTRAINT "active_tabs_tab_id_fkey" FOREIGN KEY ("tab_id") REFERENCES "public"."tabs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."active_tabs"
    ADD CONSTRAINT "active_tabs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."active_tabs"
    ADD CONSTRAINT "active_tabs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirements"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_interface_id_fkey" FOREIGN KEY ("interface_id") REFERENCES "public"."interfaces"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interfaces"
    ADD CONSTRAINT "interfaces_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interfaces"
    ADD CONSTRAINT "interfaces_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."releases"
    ADD CONSTRAINT "releases_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."releases"
    ADD CONSTRAINT "releases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."requirements"
    ADD CONSTRAINT "requirements_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."requirements"
    ADD CONSTRAINT "requirements_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."requirements"
    ADD CONSTRAINT "requirements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tabs"
    ADD CONSTRAINT "tabs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tabs"
    ADD CONSTRAINT "tabs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tenants"
    ADD CONSTRAINT "user_tenants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tenants"
    ADD CONSTRAINT "user_tenants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




























































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";




































GRANT ALL ON TABLE "public"."active_tabs" TO "anon";
GRANT ALL ON TABLE "public"."active_tabs" TO "authenticated";
GRANT ALL ON TABLE "public"."active_tabs" TO "service_role";



GRANT ALL ON TABLE "public"."ai_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."ai_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."ai_messages" TO "anon";
GRANT ALL ON TABLE "public"."ai_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_messages" TO "service_role";



GRANT ALL ON TABLE "public"."ai_sessions" TO "anon";
GRANT ALL ON TABLE "public"."ai_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."approval_stages" TO "anon";
GRANT ALL ON TABLE "public"."approval_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."approval_stages" TO "service_role";



GRANT ALL ON TABLE "public"."approval_statuses" TO "anon";
GRANT ALL ON TABLE "public"."approval_statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."approval_statuses" TO "service_role";



GRANT ALL ON TABLE "public"."attachments" TO "anon";
GRANT ALL ON TABLE "public"."attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."attachments" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."features" TO "anon";
GRANT ALL ON TABLE "public"."features" TO "authenticated";
GRANT ALL ON TABLE "public"."features" TO "service_role";



GRANT ALL ON TABLE "public"."interfaces" TO "anon";
GRANT ALL ON TABLE "public"."interfaces" TO "authenticated";
GRANT ALL ON TABLE "public"."interfaces" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."releases" TO "anon";
GRANT ALL ON TABLE "public"."releases" TO "authenticated";
GRANT ALL ON TABLE "public"."releases" TO "service_role";



GRANT ALL ON TABLE "public"."requirements" TO "anon";
GRANT ALL ON TABLE "public"."requirements" TO "authenticated";
GRANT ALL ON TABLE "public"."requirements" TO "service_role";



GRANT ALL ON TABLE "public"."roadmaps" TO "anon";
GRANT ALL ON TABLE "public"."roadmaps" TO "authenticated";
GRANT ALL ON TABLE "public"."roadmaps" TO "service_role";



GRANT ALL ON TABLE "public"."tabs" TO "anon";
GRANT ALL ON TABLE "public"."tabs" TO "authenticated";
GRANT ALL ON TABLE "public"."tabs" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."user_tenants" TO "anon";
GRANT ALL ON TABLE "public"."user_tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."user_tenants" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
