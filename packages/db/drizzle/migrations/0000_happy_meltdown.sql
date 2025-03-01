CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"hashed_key" text NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_hashed_key_unique" UNIQUE("hashed_key")
);
--> statement-breakpoint
CREATE TABLE "memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"embedding" vector(768) NOT NULL,
	"user_id" text NOT NULL,
	"org_id" text NOT NULL,
	"memory_text" text NOT NULL,
	"agent_id" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"prompt_content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prompts_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
CREATE INDEX "api_keys_company_id_idx" ON "api_keys" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "api_keys_hashed_key_revoked_idx" ON "api_keys" USING btree ("hashed_key","revoked");--> statement-breakpoint
CREATE INDEX "memories_user_id_idx" ON "memories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "memories_org_id_idx" ON "memories" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "memories_agent_id_idx" ON "memories" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "embedding_index" ON "memories" USING diskann ("embedding" vector_cosine_ops);