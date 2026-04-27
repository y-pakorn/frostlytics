ALTER TABLE "gross_protocol_revenue" ADD COLUMN "subsidy_pool_start_frost" numeric(39, 0);--> statement-breakpoint
ALTER TABLE "gross_protocol_revenue" ADD COLUMN "subsidy_pool_end_frost" numeric(39, 0);--> statement-breakpoint
ALTER TABLE "gross_protocol_revenue" ADD COLUMN "subsidy_drain_frost" numeric(39, 0);--> statement-breakpoint
ALTER TABLE "gross_protocol_revenue" ADD COLUMN "subsidy_drain_wal" double precision;--> statement-breakpoint
ALTER TABLE "gross_protocol_revenue" ADD COLUMN "subsidy_ring_breakdown" jsonb;