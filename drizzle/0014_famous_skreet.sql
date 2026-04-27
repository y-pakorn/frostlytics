CREATE TABLE "gross_protocol_revenue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp NOT NULL,
	"from_checkpoint" integer NOT NULL,
	"to_checkpoint" integer NOT NULL,
	"from_epoch" integer NOT NULL,
	"to_epoch" integer NOT NULL,
	"gross_inflow_frost" numeric(39, 0) NOT NULL,
	"gross_inflow_wal" double precision NOT NULL,
	"ring_buffer_breakdown" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gross_protocol_revenue_timestamp_unique" UNIQUE("timestamp")
);
--> statement-breakpoint
CREATE INDEX "idx_gpr__timestamp" ON "gross_protocol_revenue" USING btree ("timestamp");