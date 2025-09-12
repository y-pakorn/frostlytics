ALTER TABLE "aggregated_daily" RENAME COLUMN "staked_wal" TO "total_staked_wal";--> statement-breakpoint
ALTER TABLE "aggregated_daily" ADD COLUMN "average_staked_wal" numeric;