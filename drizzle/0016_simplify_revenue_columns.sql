ALTER TABLE "gross_protocol_revenue" DROP COLUMN "gross_inflow_frost";--> statement-breakpoint
ALTER TABLE "gross_protocol_revenue" DROP COLUMN "ring_buffer_breakdown";--> statement-breakpoint
ALTER TABLE "gross_protocol_revenue" DROP COLUMN "subsidy_pool_start_frost";--> statement-breakpoint
ALTER TABLE "gross_protocol_revenue" DROP COLUMN "subsidy_pool_end_frost";--> statement-breakpoint
ALTER TABLE "gross_protocol_revenue" DROP COLUMN "subsidy_drain_frost";--> statement-breakpoint
ALTER TABLE "gross_protocol_revenue" DROP COLUMN "subsidy_drain_wal";--> statement-breakpoint
ALTER TABLE "gross_protocol_revenue" DROP COLUMN "subsidy_ring_breakdown";--> statement-breakpoint
ALTER TABLE "gross_protocol_revenue" ADD COLUMN "pool_drain_wal" double precision;--> statement-breakpoint
ALTER TABLE "gross_protocol_revenue" ADD COLUMN "pool_funding_wal" double precision;--> statement-breakpoint
ALTER TABLE "gross_protocol_revenue" ADD COLUMN "fixed_rate_subsidy_wal" double precision;--> statement-breakpoint
ALTER TABLE "gross_protocol_revenue" ADD COLUMN "usage_subsidy_wal" double precision;--> statement-breakpoint
ALTER TABLE "gross_protocol_revenue" ADD COLUMN "user_fee_wal" double precision;
