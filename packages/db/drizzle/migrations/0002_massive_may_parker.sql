ALTER TABLE "memories" ALTER COLUMN "agent_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "memories" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6);--> statement-breakpoint
ALTER TABLE "memories" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (6);