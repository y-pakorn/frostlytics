ALTER TABLE "aggregated_daily" ALTER COLUMN "total_staked_wal" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "aggregated_daily" ALTER COLUMN "average_staked_wal" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "aggregated_daily" ALTER COLUMN "storage_usage_tb" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "aggregated_daily" ALTER COLUMN "total_storage_tb" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "aggregated_daily" ALTER COLUMN "storage_price" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "aggregated_daily" ALTER COLUMN "write_price" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "aggregated_daily" ALTER COLUMN "paid_fees_usd" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "operator_daily" ALTER COLUMN "staked_wal" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "operator_daily" ALTER COLUMN "weight_percentage" SET DATA TYPE double precision;