ALTER TABLE "backfill_log" DROP CONSTRAINT "backfill_log_pkey";--> statement-breakpoint
ALTER TABLE "backfill_log" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "backfill_log" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "backfill_log" ADD CONSTRAINT "backfill_log_pkey" PRIMARY KEY ("id");--> statement-breakpoint
DROP SEQUENCE IF EXISTS "backfill_log_id_seq";
