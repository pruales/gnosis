ALTER TABLE "api_keys" ADD COLUMN "name" text DEFAULT 'API Key';--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "creator" text NOT NULL;