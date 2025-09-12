CREATE TABLE "aggregated_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp NOT NULL,
	"active_count" integer,
	"committee_count" integer,
	"n_shard" integer,
	"staked_wal" numeric,
	"storage_usage_tb" numeric,
	"total_storage_tb" numeric,
	"paid_fees_usd" numeric
);
--> statement-breakpoint
CREATE TABLE "operator_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operator_id" varchar(66) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"staked_wal" numeric,
	"weight" integer
);
